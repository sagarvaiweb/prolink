import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as notificationService from "./notification.service.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getMyNotifications(
    req.user,
    req.query
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Notifications fetched successfully."));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(
    req.user,
    req.params.notificationId
  );
  res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read."));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, null, "All notifications marked as read."));
});

export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadNotificationCount(req.user);
  res
    .status(200)
    .json(new ApiResponse(200, { unreadCount: count }, "Unread count fetched successfully."));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user, req.params.notificationId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully."));
});
