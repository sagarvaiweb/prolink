import cloudinary from "../config/cloudinary.js";
import ApiError from "./ApiError.js";

const removeCloudinaryAssets = async (publicIds) => {
  const results = await Promise.all(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: "image",
      })
    )
  );

  if (results.some(({ result }) => result !== "ok" && result !== "not found")) {
    throw new ApiError(
      502,
      "The post was changed, but one or more images could not be removed."
    );
  }
};

const getPublicIdFromUrl = (mediaUrl) => {
  let url;
  try {
    url = new URL(mediaUrl);
  } catch {
    throw new ApiError(502, "A stored post image URL is invalid.");
  }

  const uploadPath = "/image/upload/";
  if (url.hostname !== "res.cloudinary.com" || !url.pathname.includes(uploadPath)) {
    throw new ApiError(502, "A stored post image is not a managed image.");
  }

  let publicId = url.pathname.slice(
    url.pathname.indexOf(uploadPath) + uploadPath.length
  );
  publicId = publicId.replace(/^v\d+\//, "");
  const extensionIndex = publicId.lastIndexOf(".");
  if (extensionIndex < 1) {
    throw new ApiError(502, "A stored post image URL is invalid.");
  }

  return decodeURIComponent(publicId.slice(0, extensionIndex));
};

export const cleanupUploadedPostMedia = async (files = []) => {
  const publicIds = files.map((file) => file.filename);
  if (publicIds.some((publicId) => !publicId)) {
    throw new ApiError(502, "An uploaded post image could not be identified.");
  }
  if (publicIds.length > 0) await removeCloudinaryAssets(publicIds);
};

export const deletePostMedia = async (mediaUrls = []) => {
  const publicIds = mediaUrls.map(getPublicIdFromUrl);
  if (publicIds.length > 0) await removeCloudinaryAssets(publicIds);
};
