const EMBEDDING_MODEL =
  process.env.SEARCH_EMBEDDING_MODEL ||
  "sentence-transformers/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSIONS = Number(process.env.SEARCH_VECTOR_DIMENSIONS || 384);
const EMBEDDING_TIMEOUT_MS = Number(process.env.SEARCH_AI_TIMEOUT_MS || 3000);

const getEmbeddingUrl = () => {
  const serviceUrl = process.env.AI_SERVICE_URL;

  if (!serviceUrl) {
    throw new Error("AI_SERVICE_URL is not configured.");
  }

  return `${serviceUrl.replace(/\/$/, "")}/embeddings`;
};

export const createEmbeddings = async (texts) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);

  try {
    const response = await fetch(getEmbeddingUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.AI_SERVICE_TOKEN
          ? { authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ texts }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Embedding service returned ${response.status}.`);
    }

    const payload = await response.json();
    const embeddings = payload.embeddings;
    const config = getSearchEmbeddingConfig();
    const validEmbeddings =
      Array.isArray(embeddings) &&
      embeddings.length === texts.length &&
      embeddings.every(
        (embedding) =>
          Array.isArray(embedding) &&
          embedding.length === config.dimensions &&
          embedding.every(Number.isFinite)
      );

    if (
      !validEmbeddings ||
      payload.model !== config.model ||
      payload.version !== config.version ||
      payload.dimensions !== config.dimensions
    ) {
      throw new Error("Embedding service returned an incompatible model or vector.");
    }

    return {
      embeddings,
      model: payload.model,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const getSearchEmbeddingConfig = () => ({
  model: EMBEDDING_MODEL,
  version: process.env.SEARCH_EMBEDDING_VERSION || "v1",
  dimensions: EMBEDDING_DIMENSIONS,
});
