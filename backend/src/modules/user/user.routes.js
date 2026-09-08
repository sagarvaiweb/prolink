import { Router } from "express";
import { getAllUsers, getUserById } from "./user.controller.js";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";

const router = Router();

router.get("/", authenticateUser, authorizeRole("admin"), getAllUsers);
router.get("/:id", authenticateUser, authorizeRole("admin"), getUserById);

export default router;