const runSafely = async (operation, modelName, ids, options = {}) => {
  try {
    const {
      syncModelEntities,
      deactivateModelEntities,
    } = await import("../../modules/search/search.sync.service.js");

    if (operation === "sync") {
      await syncModelEntities(modelName, ids, options);
    } else {
      await deactivateModelEntities(modelName, ids);
    }
  } catch (error) {
    console.error(`Search index ${operation} failed for ${modelName}.`, error);
  }
};

const getUpdatedPaths = (update) => {
  if (!update) return [];
  if (Array.isArray(update)) return null;

  return Object.entries(update).flatMap(([operator, value]) =>
    operator.startsWith("$") && value && typeof value === "object"
      ? Object.keys(value)
      : [operator]
  );
};

const affectsSearchIndex = (paths, searchableFields) =>
  paths === null ||
  paths.some((path) =>
    searchableFields.some(
      (field) =>
        path === field ||
        path.startsWith(`${field}.`) ||
        field.startsWith(`${path}.`)
    )
  );

const getSearchIds = async (model, ids) => {
  if (model.modelName !== "Profile") return ids;

  return model.distinct("user", { _id: { $in: ids } });
};

export const searchSyncPlugin = (schema, options = {}) => {
  const searchableFields = options.searchableFields || [];

  schema.pre("save", function () {
    const changedFields = searchableFields.filter((field) =>
      this.isModified(field)
    );

    this.$locals.searchIndexChanged = this.isNew || changedFields.length > 0;
    this.$locals.searchSyncOptions = {
      syncRelatedPosts: changedFields.includes("accountStatus"),
      syncRelatedUserJobs: changedFields.includes("accountStatus"),
      syncRelatedJobs: changedFields.some((field) =>
        ["name", "industry", "isSuspended"].includes(field)
      ),
    };
  });

  schema.post("save", async function (document) {
    if (!document.$locals.searchIndexChanged) return;

    const modelName = document.constructor.modelName;
    const id = modelName === "Profile" ? document.user : document._id;

    await runSafely(
      "sync",
      modelName,
      [id],
      document.$locals.searchSyncOptions
    );
  });

  schema.post(
    "deleteOne",
    { document: true, query: false },
    async function (document) {
      const modelName = document.constructor.modelName;
      const id = modelName === "Profile" ? document.user : document._id;

      await runSafely("deactivate", modelName, [id]);
    }
  );

  schema.pre(
    ["updateOne", "updateMany", "findOneAndUpdate"],
    async function () {
      const updatePaths = getUpdatedPaths(this.getUpdate());
      this._searchSyncIds = [];

      if (!affectsSearchIndex(updatePaths, searchableFields)) return;

      const ids = await this.model.distinct("_id", this.getFilter());
      this._searchSyncIds = await getSearchIds(this.model, ids);
      this._searchSyncOptions = {
        syncRelatedPosts:
          updatePaths === null
            ? this.model.modelName === "User"
            : updatePaths.includes("accountStatus"),
        syncRelatedUserJobs:
          updatePaths === null
            ? this.model.modelName === "User"
            : updatePaths.includes("accountStatus"),
        syncRelatedJobs:
          updatePaths === null
            ? this.model.modelName === "Company"
            : updatePaths.some((field) =>
                ["name", "industry", "isSuspended"].includes(field)
              ),
      };
    }
  );

  schema.post(
    ["updateOne", "updateMany", "findOneAndUpdate"],
    async function () {
      if (!this._searchSyncIds?.length) return;

      await runSafely(
        "sync",
        this.model.modelName,
        this._searchSyncIds,
        this._searchSyncOptions
      );
    }
  );

  schema.pre(
    ["deleteOne", "deleteMany", "findOneAndDelete"],
    async function () {
      const ids = await this.model.distinct("_id", this.getFilter());
      this._searchSyncIds = await getSearchIds(this.model, ids);
    }
  );

  schema.post(
    ["deleteOne", "deleteMany", "findOneAndDelete"],
    async function () {
      if (!this._searchSyncIds?.length) return;

      await runSafely(
        "deactivate",
        this.model.modelName,
        this._searchSyncIds
      );
    }
  );
};
