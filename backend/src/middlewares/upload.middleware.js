import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js" ;
import ApiError from "../utils/ApiError.js" ;

// Separate storage configs per upload type , controls folder + allowed formats
const createStorage = (folder, allowedFormats , resourceType = "image") =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `prolink/${folder}`,
      resource_type: resourceType, 
      allowed_formats: allowedFormats,
    },
  });

const fileFilter = (allowedMimeTypes) => (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "Only PDF/JPG/PNG files are allowed."), false);
  }
};

// Photo uploads (avatar, cover) , JPG/PNG, max 2MB
export const uploadPhoto = multer({
  storage: createStorage("photos", ["jpg", "jpeg", "png"] , "image"),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: fileFilter(["image/jpeg", "image/png"]),
});

// Resume uploads , PDF only, max 5MB
export const uploadResume = multer({
  storage: createStorage("resumes", ["pdf"] , "image"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(["application/pdf"]),
});