import { Schema, model } from "mongoose";

const searchDocumentSchema = new Schema(
  {
    entityType: { type: String, required: true, enum: ["job", "post", "profile", "company"] },
    entityId: { type: Schema.Types.ObjectId, required: true },
    text: { type: String, required: true },
    contentHash: { type: String, required: true },
    embedding: { type: [Number], default: undefined },
    embeddingProvider: { type: String, default: null },
    embeddingModel: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isSearchable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

searchDocumentSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
searchDocumentSchema.index({ entityType: 1, isSearchable: 1, updatedAt: -1 });
searchDocumentSchema.index({ text: "text" });

export const SearchDocument = model("SearchDocument", searchDocumentSchema);
