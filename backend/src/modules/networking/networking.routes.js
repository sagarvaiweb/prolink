import { Router } from "express";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
  sendConnectionRequest,
} from "./networking.controller.js";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  acceptConnectionRequestSchema,
  sendConnectionRequestSchema,
} from "./networking.validation.js";

const router = Router();

router.post(
  "/connections/request",
  authenticateUser,
  validateRequest(sendConnectionRequestSchema),
  sendConnectionRequest
);

router.patch(
  "/connections/accept",
  authenticateUser,
  validateRequest(acceptConnectionRequestSchema),
  acceptConnectionRequest
);

router.patch(
  "/connections/reject",
  authenticateUser,
  validateRequest(acceptConnectionRequestSchema),
  rejectConnectionRequest
);

router.patch(
  "/connections/cancel",
  authenticateUser,
  validateRequest(acceptConnectionRequestSchema),
  cancelConnectionRequest
);

export default router;
