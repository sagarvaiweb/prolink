import ApiError from "../../utils/ApiError.js";

// Provider contract: embed(text) -> { vector, provider, model }.
// A Sentence Transformers HTTP service can implement POST { inputs: [text] }
// and return { embeddings: [[...]] } (or a single vector array).
export const embedText = async (text) => {
  const endpoint = process.env.EMBEDDING_API_URL;
  if (!endpoint) return null;

  const headers = { "content-type": "application/json" };
  if (process.env.EMBEDDING_API_KEY) {
    headers.authorization = `Bearer ${process.env.EMBEDDING_API_KEY}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs: [text] }),
      signal: AbortSignal.timeout(Number(process.env.EMBEDDING_TIMEOUT_MS) || 10000),
    });
  } catch (error) {
    throw new ApiError(502, `Embedding provider request failed: ${error.message}`);
  }
  if (!response.ok) throw new ApiError(502, `Embedding provider returned ${response.status}.`);

  const payload = await response.json();
  const vector = Array.isArray(payload) && Array.isArray(payload[0])
    ? payload[0]
    : payload?.embeddings?.[0] ?? payload?.embedding;
  if (!Array.isArray(vector) || vector.length === 0 || vector.some((value) => !Number.isFinite(value))) {
    throw new ApiError(502, "Embedding provider returned an invalid vector.");
  }
  return {
    vector,
    provider: process.env.EMBEDDING_PROVIDER || "http",
    model: process.env.EMBEDDING_MODEL || payload?.model || "configured-model",
  };
};

export const cosineSimilarity = (left, right) => {
  if (!left?.length || left.length !== right?.length) return null;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  if (!leftNorm || !rightNorm) return null;
  return dot / Math.sqrt(leftNorm * rightNorm);
};
