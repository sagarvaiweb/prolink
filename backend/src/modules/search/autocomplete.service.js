import { SearchDocument } from "../../models/SearchDocument.model.js";
import ApiError from "../../utils/ApiError.js";
import { getProfileVisibilityContext } from "../profile/profile.visibility.service.js";
import { hydrateCandidates } from "./search.service.js";

const ENTITY_TYPES = {
  people: "person",
  jobs: "job",
  companies: "company",
};

const SEARCH_INDEX =
  process.env.SEARCH_TEXT_INDEX || "searchdocument_text_index";
const MAX_CANDIDATES = 40;

const getSelectedTypes = (type) =>
  type === "all" ? Object.keys(ENTITY_TYPES) : type.split(",");

const buildAutocompleteQuery = (query, types, visibilityContext) => ({
  index: SEARCH_INDEX,
  compound: {
    must: [
      {
        autocomplete: {
          path: "suggestionText",
          query: query.q,
          tokenOrder: "sequential",
        },
      },
    ],
    filter: [
      {
        equals: {
          path: "isActive",
          value: true,
        },
      },
    ],
    should: types.map((type) => {
      const entityFilter = {
        equals: {
          path: "entityType",
          value: ENTITY_TYPES[type],
        },
      };

      if (type !== "people") return entityFilter;

      return {
        compound: {
          filter: [entityFilter],
          should: [
            {
              equals: {
                path: "metadata.visibility",
                value: "public",
              },
            },
            {
              in: {
                path: "metadata.authorId",
                value: visibilityContext.visibleUserIds,
              },
            },
          ],
          minimumShouldMatch: 1,
        },
      };
    }),
    minimumShouldMatch: 1,
  },
});

const getSubtitle = (suggestion) => {
  if (suggestion.entityType === "person") {
    return suggestion.data.headline || suggestion.data.location || "";
  }

  if (suggestion.entityType === "job") {
    return suggestion.data.company?.name || suggestion.data.location || "";
  }

  return suggestion.data.industry || suggestion.data.location || "";
};

export const autocomplete = async (requester, query) => {
  if (requester.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }

  const types = getSelectedTypes(query.type);
  const visibilityContext = types.includes("people")
    ? await getProfileVisibilityContext(requester._id)
    : null;
  const candidates = await SearchDocument.aggregate([
    { $search: buildAutocompleteQuery(query, types, visibilityContext) },
    { $limit: Math.min(query.limit * 4, MAX_CANDIDATES) },
    {
      $project: {
        entityId: 1,
        entityType: 1,
        score: { $meta: "searchScore" },
      },
    },
  ]);
  const hydrated = await hydrateCandidates(
    candidates,
    requester,
    visibilityContext
  );
  const seen = new Set();
  const suggestions = [];

  for (const suggestion of hydrated) {
    const key = `${suggestion.entityType}:${suggestion.entityId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const title =
      suggestion.title || suggestion.data.username || suggestion.data.name || "";
    if (!title) continue;

    suggestions.push({
      entityType: suggestion.entityType,
      entityId: suggestion.entityId,
      title,
      subtitle: getSubtitle(suggestion),
    });

    if (suggestions.length === query.limit) break;
  }

  return {
    query: query.q,
    suggestions,
  };
};
