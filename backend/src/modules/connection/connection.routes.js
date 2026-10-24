import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "./connection.controller.js";
import {
  connectionIdParamsSchema,
  sendConnectionRequestSchema,
} from "./connection.validation.js";

const router = Router();

router.post(
  "/",
  authenticateUser,
  validateRequest(sendConnectionRequestSchema),
  sendConnectionRequest
);
router.patch(
  "/:connectionId/accept",
  authenticateUser,
  validateParams(connectionIdParamsSchema),
  acceptConnectionRequest
);
router.patch(
  "/:connectionId/reject",
  authenticateUser,
  validateParams(connectionIdParamsSchema),
  rejectConnectionRequest
);
router.delete(
  "/:connectionId/cancel",
  authenticateUser,
  validateParams(connectionIdParamsSchema),
  cancelConnectionRequest
);
router.delete(
  "/:connectionId",
  authenticateUser,
  validateParams(connectionIdParamsSchema),
  removeConnection
);

export default router;
