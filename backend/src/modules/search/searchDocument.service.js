import { createHash } from "node:crypto";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { embedText } from "./embedding.service.js";

const hashText = (text) => createHash("sha256").update(text).digest("hex");

export const upsertSearchDocument = async ({ entityType, entityId, text, metadata = {}, isSearchable = true }) => {
  const normalizedText = String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 30000);
  if (!normalizedText) return deleteSearchDocument(entityType, entityId);

  const contentHash = hashText(normalizedText);
  const existing = await SearchDocument.findOne({ entityType, entityId }).select("contentHash").lean();
  if (existing?.contentHash === contentHash) {
    await SearchDocument.updateOne({ entityType, entityId }, { $set: { metadata, isSearchable } });
    return;
  }

  let generated = null;
  try {
    generated = await embedText(normalizedText);
  } catch (error) {
    // Keep the lexical document current if an optional embedding service is unavailable.
    console.error("Search embedding generation failed; saved lexical document instead:", error.message);
  }
  const update = {
    $set: {
      text: normalizedText,
      contentHash,
      metadata,
      isSearchable,
    },
  };
  if (generated) {
    Object.assign(update.$set, {
      embedding: generated.vector,
      embeddingProvider: generated.provider,
      embeddingModel: generated.model,
    });
  } else {
    update.$unset = { embedding: 1, embeddingProvider: 1, embeddingModel: 1 };
  }

  await SearchDocument.updateOne(
    { entityType, entityId },
    update,
    { upsert: true }
  );
};

export const deleteSearchDocument = async (entityType, entityId) =>
  SearchDocument.deleteOne({ entityType, entityId });

export const setSearchable = async (entityType, entityId, isSearchable) =>
  SearchDocument.updateOne({ entityType, entityId }, { $set: { isSearchable } });
