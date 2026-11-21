const runSafely = async (operation, modelName, ids) => {
  try {
    const {
      syncModelEntities,
      deactivateModelEntities,
    } = await import("../../modules/search/search.sync.service.js");

    if (operation === "sync") {
      await syncModelEntities(modelName, ids);
    } else {
      await deactivateModelEntities(modelName, ids);
    }
  } catch (error) {
    // Search indexing should not interrupt writes to the source records.
    console.error(`Search index ${operation} failed for ${modelName}.`, error);
  }
};

const getSearchModelName = (modelName) =>
  modelName === "Profile" ? "User" : modelName;

const getSearchIds = async (model, ids) => {
  if (model.modelName !== "Profile") return ids;

  return model.distinct("user", { _id: { $in: ids } });
};

export const searchSyncPlugin = (schema) => {
  schema.post("save", async function (document) {
    const modelName = document.constructor.modelName;
    const id = modelName === "Profile" ? document.user : document._id;

    await runSafely("sync", getSearchModelName(modelName), [id]);
  });

  schema.post(
    "deleteOne",
    { document: true, query: false },
    async function (document) {
      const modelName = document.constructor.modelName;
      const id = modelName === "Profile" ? document.user : document._id;

      await runSafely("deactivate", getSearchModelName(modelName), [id]);
    }
  );

  schema.pre(
    ["updateOne", "updateMany", "findOneAndUpdate"],
    async function () {
      const ids = await this.model.distinct("_id", this.getFilter());
      this._searchSyncIds = await getSearchIds(this.model, ids);
    }
  );

  schema.post(
    ["updateOne", "updateMany", "findOneAndUpdate"],
    async function () {
      if (!this._searchSyncIds?.length) return;

      await runSafely(
        "sync",
        getSearchModelName(this.model.modelName),
        this._searchSyncIds
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
        getSearchModelName(this.model.modelName),
        this._searchSyncIds
      );
    }
  );
};
