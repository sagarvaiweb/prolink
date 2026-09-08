import { Router } from "express";
import { getAllUsers, getUserById , updateUser, updateAccountStatus , deleteUser } from "./user.controller.js";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import { updateUserSchema, updateAccountStatusSchema } from "./user.validation.js";

const router = Router();

router.get("/", authenticateUser, authorizeRole("admin"), getAllUsers);
router.get("/:id", authenticateUser, authorizeRole("admin"), getUserById);
router.patch("/:id", authenticateUser, authorizeRole("admin"), validateRequest(updateUserSchema), updateUser);
router.patch("/:id/status", authenticateUser, authorizeRole("admin"), validateRequest(updateAccountStatusSchema), updateAccountStatus);
router.delete("/:id", authenticateUser, authorizeRole("admin"), deleteUser);


export default router;