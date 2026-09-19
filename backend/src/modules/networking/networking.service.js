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

// Removes an accepted connection for either participant.
export const removeConnection = async (userId, { connectionId }) => {
  const connection = await Connection.findById(connectionId);

  if (!connection) {
    throw new ApiError(404, "Connection not found.");
  }

  const isParticipant =
    connection.requester.equals(userId) || connection.recipient.equals(userId);

  if (!isParticipant) {
    throw new ApiError(403, "You are not authorized to remove this connection.");
  }

  if (connection.status !== "accepted") {
    throw new ApiError(400, "Only accepted connections can be removed.");
  }

  await connection.deleteOne();

  return { _id: connection._id };
};

const SAFE_USER_PROFILE_FIELDS = "firstName lastName username role avatar";

const getPaginationValues = ({ page = 1, limit = 10 }) => {
  const currentPage = Number(page);
  const pageSize = Number(limit);

  return {
    currentPage,
    pageSize,
    skip: (currentPage - 1) * pageSize,
  };
};

const safeProfile = (user) => {
  if (!user) return null;

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    role: user.role,
    avatar: user.avatar,
  };
};

// Lists accepted connections and returns the other participant's safe profile.
export const getConnections = async (userId, { page = 1, limit = 10 }) => {
  const { currentPage, pageSize, skip } = getPaginationValues({ page, limit });
  const connectionFilter = {
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  };

  const connectionsQuery = Connection.find(connectionFilter)
    .populate("requester", SAFE_USER_PROFILE_FIELDS)
    .populate("recipient", SAFE_USER_PROFILE_FIELDS)
    .sort({ respondedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  const [connections, totalConnections] = await Promise.all([
    connectionsQuery,
    Connection.countDocuments(connectionFilter),
  ]);

  const currentUserId = userId.toString();
  return {
    connections: connections.map((connection) => {
      const requesterId = connection.requester?._id?.toString();
      const otherUser =
        requesterId === currentUserId ? connection.recipient : connection.requester;

      return {
        _id: connection._id,
        user: safeProfile(otherUser),
        connectedAt: connection.respondedAt,
      };
    }),
    pagination: {
      currentPage,
      limit: pageSize,
      totalConnections,
      totalPages: Math.ceil(totalConnections / pageSize),
    },
  };
};

const getPendingConnectionRequests = async (
  userId,
  { page = 1, limit = 10 },
  { userField, profileField }
) => {
  const { currentPage, pageSize, skip } = getPaginationValues({ page, limit });
  const requestFilter = getPendingRequestFilter(userId, userField);

  const requestsQuery = Connection.find(requestFilter)
    .populate(profileField, SAFE_USER_PROFILE_FIELDS)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);

  const [requests, totalRequests] = await Promise.all([
    requestsQuery,
    Connection.countDocuments(requestFilter),
  ]);

  return {
    requests: requests.map((request) => ({
      _id: request._id,
      [profileField]: safeProfile(request[profileField]),
      createdAt: request.createdAt,
    })),
    pagination: {
      currentPage,
      limit: pageSize,
      totalRequests,
      totalPages: Math.ceil(totalRequests / pageSize),
    },
  };
};

const getPendingRequestFilter = (userId, userField) => ({
  status: "pending",
  [userField]: userId,
});

// Lists pending requests received by the authenticated user.
export const getReceivedConnectionRequests = async (userId, pagination = {}) => {
  return getPendingConnectionRequests(userId, pagination, {
    userField: "recipient",
    profileField: "requester",
  });
};

// Lists pending requests sent by the authenticated user.
export const getSentConnectionRequests = async (userId, pagination = {}) => {
  return getPendingConnectionRequests(userId, pagination, {
    userField: "requester",
    profileField: "recipient",
  });
};

// Counts pending connection requests received by the authenticated user.
export const getReceivedConnectionRequestCount = async (userId) => {
  const count = await Connection.countDocuments(
    getPendingRequestFilter(userId, "recipient")
  );

  return { count };
};

// Gets the active connection status between the authenticated user and a target user.
export const getConnectionStatus = async (currentUserId, { userId }) => {
  if (currentUserId.toString() === userId) {
    throw new ApiError(400, "You cannot check connection status with yourself.");
  }

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, "User account not found.");
  }

  const connection = await Connection.findOne({
    status: { $in: ["pending", "accepted"] },
    $or: [
      { requester: currentUserId, recipient: targetUser._id },
      { requester: targetUser._id, recipient: currentUserId },
    ],
  });

  if (!connection) {
    return { status: "none" };
  }

  if (connection.status === "accepted") {
    return { status: "accepted" };
  }

  return {
    status: connection.requester.equals(currentUserId)
      ? "pending_sent"
      : "pending_received",
  };
};
