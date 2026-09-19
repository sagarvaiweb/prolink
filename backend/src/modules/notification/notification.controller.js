import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as notificationService from "./notification.service.js";

// Lists notifications for the authenticated user.
export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotifications(req.user._id, req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Notifications fetched successfully.")
  );
});

// Counts unread notifications for the authenticated user.
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadNotificationCount(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, result, "Unread notification count fetched successfully.")
  );
});

// Marks one of the authenticated user's notifications as read.
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.user._id,
    req.params
  );

  return res.status(200).json(
    new ApiResponse(200, notification, "Notification marked as read successfully.")
  );
});
