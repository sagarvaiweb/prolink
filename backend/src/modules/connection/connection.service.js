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

const getPagination = ({ page = 1, limit = 10 }) => {
  const currentPage = Number(page);
  const pageSize = Number(limit);

  return {
    page: currentPage,
    limit: pageSize,
    skip: (currentPage - 1) * pageSize,
  };
};

const getConnectionPage = async (filter, pagination) => {
  const { page, limit, skip } = getPagination(pagination);
  const [connections, total] = await Promise.all([
    Connection.find(filter)
      .populate("requester", "firstName lastName username avatar role")
      .populate("recipient", "firstName lastName username avatar role")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Connection.countDocuments(filter),
  ]);

  return {
    connections,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
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

export const getMyConnections = async (user, pagination) => {
  ensureUserAccountIsActive(user);

  return getConnectionPage(
    {
      status: "accepted",
      $or: [{ requester: user._id }, { recipient: user._id }],
    },
    pagination
  );
};

export const getPendingRequests = async (recipient, pagination) => {
  ensureUserAccountIsActive(recipient);

  return getConnectionPage(
    { recipient: recipient._id, status: "pending" },
    pagination
  );
};

export const getSentRequests = async (requester, pagination) => {
  ensureUserAccountIsActive(requester);

  return getConnectionPage(
    { requester: requester._id, status: "pending" },
    pagination
  );
};

export const getSuggestions = async (user, pagination) => {
  ensureUserAccountIsActive(user);

  const { page, limit, skip } = getPagination(pagination);
  const acceptedConnections = await Connection.find({
    status: "accepted",
    $or: [{ requester: user._id }, { recipient: user._id }],
  })
    .select("requester recipient")
    .lean();

  const directConnectionIds = new Set(
    acceptedConnections.map((connection) =>
      String(
        connection.requester.equals(user._id)
          ? connection.recipient
          : connection.requester
      )
    )
  );

  if (directConnectionIds.size === 0) {
    return {
      suggestions: [],
      pagination: { total: 0, page, limit, totalPages: 0 },
    };
  }

  const [activeDirectConnections, pendingConnections] = await Promise.all([
    User.find({
      _id: { $in: [...directConnectionIds] },
      accountStatus: "active",
    })
      .select("_id")
      .lean(),
    Connection.find({
      status: "pending",
      $or: [{ requester: user._id }, { recipient: user._id }],
    })
      .select("requester recipient")
      .lean(),
  ]);
  const directFriendObjectIds = activeDirectConnections.map(
    (connection) => connection._id
  );

  if (directFriendObjectIds.length === 0) {
    return {
      suggestions: [],
      pagination: { total: 0, page, limit, totalPages: 0 },
    };
  }

  const pendingUserIds = new Set(
    pendingConnections.map((connection) =>
      String(
        connection.requester.equals(user._id)
          ? connection.recipient
          : connection.requester
      )
    )
  );

  const excludedObjectIds = [
    ...new Set([
      String(user._id),
      ...directConnectionIds,
      ...pendingUserIds,
    ]),
  ].map((id) => new mongoose.Types.ObjectId(id));

  // Candidate grouping, ranking, and pagination now run in MongoDB
  const [result] = await Connection.aggregate([
    {
      $match: {
        status: "accepted",
        $or: [
          { requester: { $in: directFriendObjectIds } },
          { recipient: { $in: directFriendObjectIds } },
        ],
      },
    },
    {
      $project: {
        candidateId: {
          $cond: [
            { $in: ["$requester", directFriendObjectIds] },
            "$recipient",
            "$requester",
          ],
        },
        mutualFriendId: {
          $cond: [
            { $in: ["$requester", directFriendObjectIds] },
            "$requester",
            "$recipient",
          ],
        },
      },
    },
    { $match: { candidateId: { $nin: excludedObjectIds } } },
    {
      $group: {
        _id: "$candidateId",
        mutualFriendIds: { $addToSet: "$mutualFriendId" },
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "candidate",
      },
    },
    { $unwind: "$candidate" },
    { $match: { "candidate.accountStatus": "active" } },
    {
      $project: {
        _id: "$candidate._id",
        firstName: "$candidate.firstName",
        lastName: "$candidate.lastName",
        username: "$candidate.username",
        avatar: "$candidate.avatar",
        role: "$candidate.role",
        mutualConnectionsCount: { $size: "$mutualFriendIds" },
      },
    },
    { $sort: { mutualConnectionsCount: -1, username: 1, _id: 1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        suggestions: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const suggestions = result?.suggestions ?? [];
  const total = result?.metadata[0]?.total ?? 0;

  return {
    suggestions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
