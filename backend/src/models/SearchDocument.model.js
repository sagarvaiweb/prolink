import { Schema, model } from "mongoose";

const searchDocumentSchema = new Schema(
  {
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    entityType: {
      type: String,
      enum: ["person", "job", "post", "company"],
      required: true,
    },
    searchableText: {
      type: String,
      required: true,
      maxlength: 30000,
    },
    suggestionText: {
      type: [String],
      default: [],
    },
    embedding: {
      type: [Number],
      default: undefined,
      select: false,
    },
    embeddingModel: {
      type: String,
      default: null,
    },
    embeddingVersion: {
      type: String,
      default: null,
    },
    metadata: {
      role: {
        type: String,
        default: null,
      },
      title: {
        type: String,
        default: null,
      },
      location: {
        type: [String],
        default: [],
      },
      skills: {
        type: [String],
        default: [],
      },
      experienceLevel: {
        type: String,
        default: null,
      },
      employmentType: {
        type: String,
        default: null,
      },
      salaryRange: {
        type: String,
        default: null,
      },
      industry: {
        type: String,
        default: null,
      },
      visibility: {
        type: String,
        default: null,
      },
      authorId: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      postedById: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      companyId: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      createdAt: {
        type: Date,
        default: null,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

searchDocumentSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
searchDocumentSchema.index({ entityType: 1, isActive: 1 });

export const SearchDocument = model("SearchDocument", searchDocumentSchema);
