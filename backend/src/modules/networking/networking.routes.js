import { Router } from "express";
import {
  acceptConnectionRequest,
  cancelConnectionRequest,
  getConnectionStatus,
  getConnections,
  getMutualConnections,
  getFollowers,
  getFollowing,
  getFollowCounts,
  getFollowStatus,
  getReceivedConnectionRequestCount,
  getReceivedConnectionRequests,
  getSentConnectionRequests,
  removeConnection,
  rejectConnectionRequest,
  sendConnectionRequest,
  followUser,
  unfollowUser,
} from "./networking.controller.js";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  acceptConnectionRequestSchema,
  connectionStatusSchema,
  followUserSchema,
  getConnectionsSchema,
  sendConnectionRequestSchema,
} from "./networking.validation.js";

const router = Router();

router.get(
  "/connections",
  authenticateUser,
  validateRequest(getConnectionsSchema, "query"),
  getConnections
);

router.get(
  "/connections/requests/received",
  authenticateUser,
  validateRequest(getConnectionsSchema, "query"),
  getReceivedConnectionRequests
);

router.get(
  "/connections/requests/sent",
  authenticateUser,
  validateRequest(getConnectionsSchema, "query"),
  getSentConnectionRequests
);

router.get(
  "/connections/requests/count",
  authenticateUser,
  getReceivedConnectionRequestCount
);

router.get(
  "/connections/status/:userId",
  authenticateUser,
  validateRequest(connectionStatusSchema, "params"),
  getConnectionStatus
);

router.get(
  "/connections/mutual/:userId",
  authenticateUser,
  validateRequest(connectionStatusSchema, "params"),
  validateRequest(getConnectionsSchema, "query"),
  getMutualConnections
);

router.get(
  "/followers",
  authenticateUser,
  validateRequest(getConnectionsSchema, "query"),
  getFollowers
);

router.get(
  "/following",
  authenticateUser,
  validateRequest(getConnectionsSchema, "query"),
  getFollowing
);

router.get(
  "/follow/count/:userId",
  authenticateUser,
  validateRequest(followUserSchema, "params"),
  getFollowCounts
);

router.get(
  "/follow/status/:userId",
  authenticateUser,
  validateRequest(followUserSchema, "params"),
  getFollowStatus
);

router.post(
  "/follow/:userId",
  authenticateUser,
  validateRequest(followUserSchema, "params"),
  followUser
);

router.delete(
  "/follow/:userId",
  authenticateUser,
  validateRequest(followUserSchema, "params"),
  unfollowUser
);

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

router.delete(
  "/connections/:connectionId",
  authenticateUser,
  validateRequest(acceptConnectionRequestSchema, "params"),
  removeConnection
);

export default router;
