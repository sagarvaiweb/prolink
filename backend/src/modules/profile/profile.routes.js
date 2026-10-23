import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import { uploadPhoto, uploadResume as uploadResumeMiddleware } from "../../middlewares/upload.middleware.js";

import {
  updateProfileSchema,
  experienceSchema,
  educationSchema,
  updateSkillsSchema,
} from "./profile.validation.js";
import {
  getMyProfile,
  getProfileByUserId,
  updateProfile,
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadResume,
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  updateSkills,
} from "./profile.controller.js";

const router = Router();

// All profile routes require a logged-in user
router.get("/me", authenticateUser, getMyProfile);
router.get("/:userId", authenticateUser, getProfileByUserId);
router.patch("/me", authenticateUser, validateRequest(updateProfileSchema), updateProfile);

// "avatar" and "resume" here must match the frontend's FormData field name
router.post("/me/photo", authenticateUser, uploadPhoto.single("avatar"), uploadProfilePhoto);
router.post("/me/cover", authenticateUser, uploadPhoto.single("cover"), uploadCoverPhoto);
router.post("/me/resume", authenticateUser, uploadResumeMiddleware.single("resume"), uploadResume);


router.post("/me/experience", authenticateUser, validateRequest(experienceSchema), addExperience);
router.patch("/me/experience/:id", authenticateUser, validateRequest(experienceSchema), updateExperience);
router.delete("/me/experience/:id", authenticateUser, deleteExperience);

router.patch("/me/skills", authenticateUser, validateRequest(updateSkillsSchema), updateSkills);

router.post("/me/education", authenticateUser, validateRequest(educationSchema), addEducation);
router.patch("/me/education/:id", authenticateUser, validateRequest(educationSchema), updateEducation);
router.delete("/me/education/:id", authenticateUser, deleteEducation);


export default router;