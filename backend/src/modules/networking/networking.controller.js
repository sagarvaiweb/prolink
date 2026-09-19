import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as networkingService from "./networking.service.js";

// Sends a connection request from the authenticated user.
export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await networkingService.sendConnectionRequest(
    req.user._id,
    req.body
  );

  return res.status(201).json(
    new ApiResponse(201, connection, "Connection request sent successfully.")
  );
});

// Accepts a connection request for the authenticated recipient.
export const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await networkingService.acceptConnectionRequest(
    req.user._id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, connection, "Connection request accepted successfully.")
  );
});

// Rejects a connection request for the authenticated recipient.
export const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await networkingService.rejectConnectionRequest(
    req.user._id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, connection, "Connection request rejected successfully.")
  );
});

// Cancels a connection request for the authenticated requester.
export const cancelConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await networkingService.cancelConnectionRequest(
    req.user._id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, connection, "Connection request cancelled successfully.")
  );
});

// Removes an accepted connection for the authenticated participant.
export const removeConnection = asyncHandler(async (req, res) => {
  const result = await networkingService.removeConnection(req.user._id, req.params);

  return res.status(200).json(
    new ApiResponse(200, result, "Connection removed successfully.")
  );
});

// Lists accepted connections for the authenticated user.
export const getConnections = asyncHandler(async (req, res) => {
  const result = await networkingService.getConnections(req.user._id, req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Connections fetched successfully.")
  );
});

// Lists pending requests received by the authenticated user.
export const getReceivedConnectionRequests = asyncHandler(async (req, res) => {
  const result = await networkingService.getReceivedConnectionRequests(
    req.user._id,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Received connection requests fetched successfully.")
  );
});

// Lists pending requests sent by the authenticated user.
export const getSentConnectionRequests = asyncHandler(async (req, res) => {
  const result = await networkingService.getSentConnectionRequests(
    req.user._id,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Sent connection requests fetched successfully.")
  );
});

// Counts pending requests received by the authenticated user.
export const getReceivedConnectionRequestCount = asyncHandler(async (req, res) => {
  const result = await networkingService.getReceivedConnectionRequestCount(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, result, "Received connection request count fetched successfully.")
  );
});

// Gets the connection status between the authenticated user and a target user.
export const getConnectionStatus = asyncHandler(async (req, res) => {
  const result = await networkingService.getConnectionStatus(req.user._id, req.params);

  return res.status(200).json(
    new ApiResponse(200, result, "Connection status fetched successfully.")
  );
});
