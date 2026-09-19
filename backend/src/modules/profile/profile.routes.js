import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
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
  addExperience,
  updateExperience,
  deleteExperience,
  addEducation,
  updateSkills,
} from "./profile.controller.js";

const router = Router();

// All profile routes require a logged-in user
router.get("/me", authenticateUser, getMyProfile);
router.get("/:userId", authenticateUser, getProfileByUserId);
router.patch("/me", authenticateUser, validateRequest(updateProfileSchema), updateProfile);

router.post("/me/experience", authenticateUser, validateRequest(experienceSchema), addExperience);
router.patch("/me/experience/:id", authenticateUser, validateRequest(experienceSchema), updateExperience);
router.delete("/me/experience/:id", authenticateUser, deleteExperience);

router.patch("/me/skills", authenticateUser, validateRequest(updateSkillsSchema), updateSkills);

router.post("/me/education", authenticateUser, validateRequest(educationSchema), addEducation);


export default router;