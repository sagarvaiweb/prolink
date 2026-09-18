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
