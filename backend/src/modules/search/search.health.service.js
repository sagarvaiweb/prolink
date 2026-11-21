import mongoose from "mongoose";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { getSearchEmbeddingConfig } from "./search.embedding.service.js";

const SEARCH_INDEX =
  process.env.SEARCH_TEXT_INDEX || "searchdocument_text_index";
const VECTOR_INDEX =
  process.env.SEARCH_VECTOR_INDEX || "searchdocument_vector_index";
const HEALTH_TIMEOUT_MS = 2000;

const checkAtlasIndex = async (name, pipeline, message) => {
  try {
    await SearchDocument.aggregate(pipeline).option({
      maxTimeMS: HEALTH_TIMEOUT_MS,
    });
    return { status: "ready", index: name };
  } catch (error) {
    console.error(`Search readiness check failed for ${name}.`, error);
    return { status: "error", index: name, message };
  }
};

const checkEmbeddingService = async () => {
  const serviceUrl = process.env.AI_SERVICE_URL;
  if (!serviceUrl) {
    return {
      status: "disabled",
      message: "AI_SERVICE_URL is not configured.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  const headers = process.env.AI_SERVICE_TOKEN
    ? { authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}` }
    : {};

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/health`, {
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Health endpoint returned ${response.status}.`);
    }

    const service = await response.json();
    const expected = getSearchEmbeddingConfig();
    const matchesConfig =
      service.model === expected.model &&
      service.version === expected.version &&
      service.dimensions === expected.dimensions;

    if (!matchesConfig) {
      return {
        status: "mismatch",
        message: "Embedding service model settings do not match the backend.",
        expectedModel: expected.model,
        expectedVersion: expected.version,
        expectedDimensions: expected.dimensions,
        actualModel: service.model || null,
        actualVersion: service.version || null,
        actualDimensions: service.dimensions || null,
      };
    }

    if (service.authentication !== "configured") {
      return {
        status: "warning",
        message: "Embedding service authentication is not configured.",
        model: service.model,
        version: service.version,
        dimensions: service.dimensions,
      };
    }

    return {
      status: "ready",
      model: service.model,
      version: service.version,
      dimensions: service.dimensions,
    };
  } catch (error) {
    console.error("Search readiness check failed for the embedding service.", error);
    return {
      status: "error",
      message: "Embedding service is unreachable or not ready.",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const checkTextIndex = () =>
  checkAtlasIndex(
    SEARCH_INDEX,
    [
      {
        $search: {
          index: SEARCH_INDEX,
          text: { path: "searchableText", query: "searchreadinessprobe" },
        },
      },
      { $limit: 1 },
      { $project: { _id: 1 } },
    ],
    "Atlas Search index is missing, building, or missing required mappings."
  );

const checkAutocompleteIndex = () =>
  checkAtlasIndex(
    SEARCH_INDEX,
    [
      {
        $search: {
          index: SEARCH_INDEX,
          autocomplete: {
            path: "suggestionText",
            query: "readinessprobe",
            tokenOrder: "sequential",
          },
        },
      },
      { $limit: 1 },
      { $project: { _id: 1 } },
    ],
    "Autocomplete mapping is missing or the Atlas Search index is not ready."
  );

const checkVectorIndex = () => {
  const embeddingConfig = getSearchEmbeddingConfig();
  if (
    !Number.isInteger(embeddingConfig.dimensions) ||
    embeddingConfig.dimensions < 1
  ) {
    return Promise.resolve({
      status: "error",
      index: VECTOR_INDEX,
      message: "SEARCH_VECTOR_DIMENSIONS must be a positive integer.",
    });
  }

  const queryVector = Array(embeddingConfig.dimensions).fill(0);
  queryVector[0] = 1;

  return checkAtlasIndex(
    VECTOR_INDEX,
    [
      {
        $vectorSearch: {
          index: VECTOR_INDEX,
          path: "embedding",
          queryVector,
          numCandidates: 10,
          limit: 1,
          filter: {
            $and: [
              { entityType: "person" },
              { embeddingModel: embeddingConfig.model },
              { embeddingVersion: embeddingConfig.version },
            ],
          },
        },
      },
      { $project: { _id: 1 } },
    ],
    "Vector Search index is missing, building, or missing required filter fields."
  );
};

const getDocumentCounts = async () => {
  const embeddingConfig = getSearchEmbeddingConfig();
  const activeFilter = { isActive: true };
  const [activeDocuments, embeddedDocuments] = await Promise.all([
    SearchDocument.countDocuments(activeFilter).maxTimeMS(HEALTH_TIMEOUT_MS),
    SearchDocument.countDocuments({
      ...activeFilter,
      embeddingModel: embeddingConfig.model,
      embeddingVersion: embeddingConfig.version,
      embedding: { $exists: true },
    }).maxTimeMS(HEALTH_TIMEOUT_MS),
  ]);
  const missingEmbeddings = Math.max(activeDocuments - embeddedDocuments, 0);

  return {
    status:
      activeDocuments === 0
        ? "empty"
        : missingEmbeddings > 0
          ? "partial"
          : "ready",
    activeDocuments,
    embeddedDocuments,
    missingEmbeddings,
    embeddingCoveragePercent: activeDocuments
      ? Math.round((embeddedDocuments / activeDocuments) * 100)
      : null,
  };
};

export const getSearchHealth = async () => {
  const databaseReady = mongoose.connection.readyState === 1;
  const skipped = { status: "skipped", message: "MongoDB is not connected." };
  const checks = {
    database: {
      status: databaseReady ? "ready" : "error",
      message: databaseReady ? undefined : "MongoDB is not connected.",
    },
    textIndex: skipped,
    autocompleteIndex: skipped,
    vectorIndex: skipped,
    embeddingService: await checkEmbeddingService(),
    documents: skipped,
  };

  if (databaseReady) {
    [checks.textIndex, checks.autocompleteIndex, checks.vectorIndex] =
      await Promise.all([
        checkTextIndex(),
        checkAutocompleteIndex(),
        checkVectorIndex(),
      ]);

    try {
      checks.documents = await getDocumentCounts();
    } catch (error) {
      console.error("Search readiness check failed for indexed documents.", error);
      checks.documents = {
        status: "error",
        message: "Could not read search document coverage.",
      };
    }
  }

  const coreReady =
    checks.database.status === "ready" && checks.textIndex?.status === "ready";
  const allFeaturesReady =
    coreReady &&
    checks.autocompleteIndex?.status === "ready" &&
    checks.vectorIndex?.status === "ready" &&
    checks.embeddingService.status === "ready" &&
    checks.documents?.status === "ready";

  return {
    status: !coreReady ? "unavailable" : allFeaturesReady ? "ready" : "degraded",
    checkedAt: new Date(),
    checks,
  };
};
