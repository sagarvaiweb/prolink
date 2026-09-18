import { Connection } from "../../models/Connection.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";

// Creates a pending professional connection request for the authenticated user.
export const sendConnectionRequest = async (senderId, { recipient }) => {
  const [sender, recipientUser] = await Promise.all([
    User.findById(senderId),
    User.findById(recipient),
  ]);

  if (!sender) {
    throw new ApiError(401, "Sender account not found.");
  }

  if (sender.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }

  if (!recipientUser || recipientUser.accountStatus !== "active") {
    throw new ApiError(404, "Recipient account not found.");
  }

  if (sender._id.equals(recipientUser._id)) {
    throw new ApiError(400, "You cannot send a connection request to yourself.");
  }

  const existingConnection = await Connection.findOne({
    status: { $in: ["pending", "accepted"] },
    $or: [
      { requester: sender._id, recipient: recipientUser._id },
      { requester: recipientUser._id, recipient: sender._id },
    ],
  });

  if (existingConnection) {
    if (existingConnection.status === "accepted") {
      throw new ApiError(409, "Users are already connected.");
    }

    throw new ApiError(409, "A connection request already exists.");
  }

  const connection = await Connection.create({
    requester: sender._id,
    recipient: recipientUser._id,
    status: "pending",
  });

  return {
    _id: connection._id,
    requester: connection.requester,
    recipient: connection.recipient,
    status: connection.status,
    respondedAt: connection.respondedAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
};

const respondToConnectionRequest = async (
  userId,
  { connectionId },
  { authorizedField, action, status }
) => {
  const connection = await Connection.findById(connectionId);

  if (!connection) {
    throw new ApiError(404, "Connection request not found.");
  }

  if (!connection[authorizedField].equals(userId)) {
    throw new ApiError(403, `You are not authorized to ${action} this connection request.`);
  }

  if (connection.status !== "pending") {
    throw new ApiError(400, `Only pending connection requests can be ${status}.`);
  }

  connection.status = status;
  connection.respondedAt = new Date();
  await connection.save();

  return {
    _id: connection._id,
    requester: connection.requester,
    recipient: connection.recipient,
    status: connection.status,
    respondedAt: connection.respondedAt,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
};

// Accepts a pending connection request for its intended recipient.
export const acceptConnectionRequest = async (recipientId, request) => {
  return respondToConnectionRequest(recipientId, request, {
    authorizedField: "recipient",
    action: "accept",
    status: "accepted",
  });
};

// Rejects a pending connection request for its intended recipient.
export const rejectConnectionRequest = async (recipientId, request) => {
  return respondToConnectionRequest(recipientId, request, {
    authorizedField: "recipient",
    action: "reject",
    status: "rejected",
  });
};

// Cancels a pending connection request for its original requester.
export const cancelConnectionRequest = async (requesterId, request) => {
  return respondToConnectionRequest(requesterId, request, {
    authorizedField: "requester",
    action: "cancel",
    status: "cancelled",
  });
};
