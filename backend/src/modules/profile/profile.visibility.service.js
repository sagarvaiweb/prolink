import { Connection } from "../../models/Connection.model.js";

export const getProfileVisibilityContext = async (viewerId) => {
  const viewer = String(viewerId);
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ requester: viewerId }, { recipient: viewerId }],
  })
    .select("requester recipient")
    .lean();
  const connectedUserIds = connections.map((connection) =>
    String(connection.requester) === viewer
      ? connection.recipient
      : connection.requester
  );

  return {
    viewerId: viewer,
    connectedUserIds: new Set(connectedUserIds.map(String)),
    visibleUserIds: [viewerId, ...connectedUserIds],
  };
};

export const isProfileVisible = (profile, visibilityContext) => {
  const profileUserId = String(profile.user?._id || profile.user);

  if (profileUserId === visibilityContext.viewerId) return true;
  if (profile.visibility === "public") return true;

  return (
    profile.visibility === "connections" &&
    visibilityContext.connectedUserIds.has(profileUserId)
  );
};

export const canViewProfile = async (profile, viewerId) => {
  const profileUserId = profile.user?._id || profile.user;
  if (String(profileUserId) === String(viewerId)) return true;
  if (profile.visibility === "public") return true;
  if (profile.visibility !== "connections") return false;

  return Boolean(
    await Connection.exists({
      status: "accepted",
      $or: [
        { requester: profileUserId, recipient: viewerId },
        { requester: viewerId, recipient: profileUserId },
      ],
    })
  );
};
