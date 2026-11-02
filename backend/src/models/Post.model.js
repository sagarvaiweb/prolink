import { Schema, model } from "mongoose";

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
      validate: {
        validator(value) {
          return (
            Boolean(value?.trim()) ||
            this.mediaUrls.length > 0 ||
            Boolean(this.originalPost)
          );
        },
        message: "A post must include text, an image, or an original post.",
      },
    },
    mediaUrls: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
      validate: {
        validator(mediaUrls) {
          return mediaUrls.length <= 4;
        },
        message: "A post can include no more than 4 images.",
      },
    },
    visibility: {
      type: String,
      enum: ["public", "connections"],
      default: "public",
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    originalPost: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1, _id: -1 });
postSchema.index({ visibility: 1, createdAt: -1, _id: -1 });

export const Post = model("Post", postSchema);
