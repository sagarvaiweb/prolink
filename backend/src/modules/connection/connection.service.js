import mongoose from "mongoose";
import { Connection } from "../../models/Connection.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";

const getPairKey = (firstUserId, secondUserId) =>{
  return [String(firstUserId), String(secondUserId)].sort().join(":");
}

const ensureUserAccountIsActive = (user) => {
  if (user.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active");
  } 
};

const ensureConnectionParticipantsAreActive = async (connection) => {
  const activeParticipantCount = await User.countDocuments({
    _id: { $in: [connection.requester, connection.recipient] },
    accountStatus: "active",
  });

  if (activeParticipantCount !== 2) {
    throw new ApiError(409, "This connection request is no longer available");
  }
};

const handleDuplicatePair = (error) => {
  if (error?.code === 11000) {
    throw new ApiError(409, "A connection already exists with this user");
  }
  throw error;
};

export const sendConnectionRequest = async (requester, recipientId) => {
  ensureUserAccountIsActive(requester);

  if (requester._id.equals(recipientId)) {
    throw new ApiError(400, "You cannot connect with yourself");
  }

  const recipient = await User.findOne({
    _id: recipientId,
    accountStatus: "active",
  }).select("_id");
 
  if (!recipient) {
    throw new ApiError(404, "User account not found");
  }

  const pairKey = getPairKey(requester._id, recipient._id);
  const existingConnection = await Connection.findOne({ pairKey });

  if (existingConnection?.status === "accepted") {
    throw new ApiError(409, "You are already connected with this user");
  }

  if (existingConnection?.status === "pending") {
    const message =
      existingConnection.requester.equals(requester._id)
        ? "Connection request already sent"
        : "This user has already sent you a connection request";
    throw new ApiError(409, message);
  }

  try {
    if (existingConnection?.status === "rejected") {
      existingConnection.requester = requester._id;
      existingConnection.recipient = recipient._id;
      existingConnection.status = "pending";
      existingConnection.respondedAt = null;
      existingConnection.createdAt = new Date();
      await existingConnection.save();
      return existingConnection;
    }

    const connection = new Connection({
      requester: requester._id,
      recipient: recipient._id,
      status: "pending", 
    });

    await connection.save();
    return connection;

  } catch (error) {
    handleDuplicatePair(error);
  }
};

const getPendingRequestForRecipient = async (connectionId, recipientId) => {
  if (!mongoose.isValidObjectId(connectionId)) {
    throw new ApiError(400, "Invalid connection request ID");
  }

  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new ApiError(404, "Connection request not found");
  }

  if (!connection.recipient.equals(recipientId)) {
    throw new ApiError(403, "You cannot respond to this request");
  }

  if (connection.status !== "pending") {
    throw new ApiError(409, "This connection request is no longer pending");
  }

  return connection;
};

export const acceptConnectionRequest = async (recipient, connectionId) => {
  ensureUserAccountIsActive(recipient);
  const connection = await getPendingRequestForRecipient(connectionId, recipient._id);
  await ensureConnectionParticipantsAreActive(connection);

  connection.status = "accepted";
  connection.respondedAt = new Date();
  await connection.save();
  return connection;
};

export const rejectConnectionRequest = async (recipient, connectionId) => {
  ensureUserAccountIsActive(recipient);
  const connection = await getPendingRequestForRecipient(connectionId, recipient._id);

  connection.status = "rejected";
  connection.respondedAt = new Date();
  await connection.save();
  return connection;
};

export const cancelConnectionRequest = async (requester, connectionId) => {
  ensureUserAccountIsActive(requester);

  if (!mongoose.isValidObjectId(connectionId)) {
    throw new ApiError(400, "Invalid connection request ID");
  }

  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new ApiError(404, "Connection request not found");
  }

  if (!connection.requester.equals(requester._id)) {
    throw new ApiError(403, "You cannot cancel this connection request");
  }

  if (connection.status !== "pending") {
    throw new ApiError(409, "Only pending connection requests can be cancelled");
  }

  await connection.deleteOne();
};

export const removeConnection = async (user, connectionId) => {
  ensureUserAccountIsActive(user);

  if (!mongoose.isValidObjectId(connectionId)) {
    throw new ApiError(400, "Invalid connection ID");
  }

  const connection = await Connection.findById(connectionId);
  if (!connection) {
    throw new ApiError(404, "Connection not found");
  }

  const isParticipant =
    connection.requester.equals(user._id) ||
    connection.recipient.equals(user._id);

  if (!isParticipant) {
    throw new ApiError(403, "You cannot remove this connection");
  }

  if (connection.status !== "accepted") {
    throw new ApiError(409, "Only accepted connections can be removed");
  }

  await connection.deleteOne();
};
