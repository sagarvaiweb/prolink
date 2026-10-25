import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  getMyConnections,
  getPendingRequests,
  getSentRequests,
  getSuggestions,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "./connection.controller.js";
import {
  connectionListQuerySchema,
  connectionIdParamsSchema,
  sendConnectionRequestSchema,
} from "./connection.validation.js";

const router = Router();

router.get(
  "/me",
  authenticateUser,
  validateQuery(connectionListQuerySchema),
  getMyConnections
);
router.get(
  "/pending",
  authenticateUser,
  validateQuery(connectionListQuerySchema),
  getPendingRequests
);
router.get(
  "/sent",
  authenticateUser,
  validateQuery(connectionListQuerySchema),
  getSentRequests
);
router.get(
  "/suggestions",
  authenticateUser,
  validateQuery(connectionListQuerySchema),
  getSuggestions
);

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
