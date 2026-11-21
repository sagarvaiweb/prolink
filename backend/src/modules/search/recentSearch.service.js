import { createHash } from "node:crypto";
import { RecentSearch } from "../../models/RecentSearch.model.js";
import ApiError from "../../utils/ApiError.js";

const normalizeEntityTypes = (type) =>
  type === "all" ? ["all"] : type.split(",").sort();

const createQueryKey = (query, entityTypes) =>
  createHash("sha256")
    .update(
      `${entityTypes.join(",")}\0${query.trim().replace(/\s+/g, " ").toLowerCase()}`
    )
    .digest("hex");

export const recordRecentSearch = async (userId, query) => {
  const entityTypes = normalizeEntityTypes(query.type);
  const queryKey = createQueryKey(query.q, entityTypes);

  try {
    await RecentSearch.findOneAndUpdate(
      { userId, queryKey },
      {
        $set: {
          query: query.q,
          entityTypes,
          searchedAt: new Date(),
        },
        $setOnInsert: { userId, queryKey },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code === 11000) {
      try {
        await RecentSearch.updateOne(
          { userId, queryKey },
          {
            $set: {
              query: query.q,
              entityTypes,
              searchedAt: new Date(),
            },
          }
        );
        return;
      } catch (retryError) {
        console.error(
          "Could not update recent search after a duplicate write.",
          retryError
        );
        return;
      }
    }

    console.error("Could not save recent search.", error);
  }
};

export const getRecentSearches = async (userId, limit) => {
  const searches = await RecentSearch.find({ userId })
    .sort({ searchedAt: -1, _id: -1 })
    .limit(limit)
    .select("query entityTypes searchedAt")
    .lean();

  return searches.map((search) => ({
    id: String(search._id),
    query: search.query,
    entityTypes: search.entityTypes,
    searchedAt: search.searchedAt,
  }));
};

export const deleteRecentSearch = async (userId, id) => {
  const search = await RecentSearch.findOneAndDelete({ _id: id, userId });

  if (!search) {
    throw new ApiError(404, "Recent search not found.");
  }
};

export const clearRecentSearches = async (userId) => {
  await RecentSearch.deleteMany({ userId });
};
