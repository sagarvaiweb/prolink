import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateRequest from "../../middlewares/validate.middleware.js";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
} from "./notification.controller.js";
import {
  getNotificationsSchema,
  notificationIdSchema,
} from "./notification.validation.js";

const router = Router();

router.get(
  "/",
  authenticateUser,
  validateRequest(getNotificationsSchema, "query"),
  getNotifications
);

router.get("/unread-count", authenticateUser, getUnreadNotificationCount);

router.patch(
  "/:notificationId/read",
  authenticateUser,
  validateRequest(notificationIdSchema, "params"),
  markNotificationAsRead
);

export default router;
