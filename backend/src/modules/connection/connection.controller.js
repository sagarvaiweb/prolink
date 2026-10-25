import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as connectionService from "./connection.service.js";

export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await connectionService.sendConnectionRequest(
    req.user,
    req.body.recipientId
  );

  return res.status(201).json(
    new ApiResponse(201, connection, "Connection request sent successfully.")
  );
});

export const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await connectionService.acceptConnectionRequest(
    req.user,
    req.params.connectionId
  );

  return res.status(200).json(
    new ApiResponse(200, connection, "Connection request accepted successfully.")
  );
});

export const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const connection = await connectionService.rejectConnectionRequest(
    req.user,
    req.params.connectionId
  );

  return res.status(200).json(
    new ApiResponse(200, connection, "Connection request rejected successfully.")
  );
});

export const cancelConnectionRequest = asyncHandler(async (req, res) => {
  await connectionService.cancelConnectionRequest(req.user, req.params.connectionId);

  return res.status(200).json(
    new ApiResponse(200, null, "Connection request cancelled successfully.")
  );
});

export const removeConnection = asyncHandler(async (req, res) => {
  await connectionService.removeConnection(req.user, req.params.connectionId);

  return res.status(200).json(
    new ApiResponse(200, null, "Connection removed successfully.")
  );
});

export const getMyConnections = asyncHandler(async (req, res) => {
  const connections = await connectionService.getMyConnections(
    req.user,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, connections, "Connections fetched successfully.")
  );
});

export const getPendingRequests = asyncHandler(async (req, res) => {
  const requests = await connectionService.getPendingRequests(
    req.user,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, requests, "Pending connection requests fetched successfully.")
  );
});

export const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await connectionService.getSentRequests(req.user, req.query);

  return res.status(200).json(
    new ApiResponse(200, requests, "Sent connection requests fetched successfully.")
  );
});

export const getSuggestions = asyncHandler(async (req, res) => {
  const suggestions = await connectionService.getSuggestions(
    req.user,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(200, suggestions, "Connection suggestions fetched successfully.")
  );
});
