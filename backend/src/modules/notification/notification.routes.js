import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "./notification.controller.js";
import {
  notificationIdParamsSchema,
  validateNotificationQuery,
} from "./notification.validation.js";

const router = Router();

router.use(authenticateUser);
router.get("/", validateNotificationQuery, getMyNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch(
  "/:notificationId/read",
  validateParams(notificationIdParamsSchema),
  markNotificationRead
);

export default router;
