import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Connection } from "../../src/models/Connection.model.js";
import { Follow } from "../../src/models/Follow.model.js";
import { Notification } from "../../src/models/Notification.model.js";
import { User } from "../../src/models/User.model.js";
import authenticateUser from "../../src/middlewares/authenticateUser.middleware.js";
import * as service from "../../src/modules/networking/networking.service.js";
import networkingRoutes from "../../src/modules/networking/networking.routes.js";
import {
  acceptConnectionRequestSchema,
  connectionStatusSchema,
  followUserSchema,
  getConnectionsSchema,
  sendConnectionRequestSchema,
} from "../../src/modules/networking/networking.validation.js";

const id = (value) => new mongoose.Types.ObjectId(value);
const ids = {
  alice: id("64b000000000000000000001"),
  bob: id("64b000000000000000000002"),
  charlie: id("64b000000000000000000003"),
  connection: id("64b000000000000000000010"),
};

const activeUser = (_id) => ({ _id, accountStatus: "active" });
const connection = ({ requester = ids.alice, recipient = ids.bob, status = "pending" } = {}) => ({
  _id: ids.connection,
  requester,
  recipient,
  status,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  respondedAt: null,
  save: async function () { this.updatedAt = new Date(); },
  deleteOne: async function () { this.deleted = true; },
});

const original = {
  connectionFindById: Connection.findById,
  connectionFind: Connection.find,
  connectionFindOne: Connection.findOne,
  connectionFindOneAndUpdate: Connection.findOneAndUpdate,
  connectionCreate: Connection.create,
  connectionFindOneAndDelete: Connection.findOneAndDelete,
  connectionCountDocuments: Connection.countDocuments,
  connectionAggregate: Connection.aggregate,
  followFindOne: Follow.findOne,
  followCreate: Follow.create,
  followFindOneAndDelete: Follow.findOneAndDelete,
  followExists: Follow.exists,
  followCountDocuments: Follow.countDocuments,
  userFindById: User.findById,
  userAggregate: User.aggregate,
  notificationFindOneAndUpdate: Notification.findOneAndUpdate,
};

test.afterEach(() => {
  Object.assign(Connection, {
  findById: original.connectionFindById,
  find: original.connectionFind,
  findOne: original.connectionFindOne,
  findOneAndUpdate: original.connectionFindOneAndUpdate,
  create: original.connectionCreate,
  findOneAndDelete: original.connectionFindOneAndDelete,
  countDocuments: original.connectionCountDocuments,
  aggregate: original.connectionAggregate,
  });
  Object.assign(Follow, {
  findOne: original.followFindOne,
  create: original.followCreate,
  findOneAndDelete: original.followFindOneAndDelete,
  exists: original.followExists,
  countDocuments: original.followCountDocuments,
  });
  Object.assign(User, { findById: original.userFindById, aggregate: original.userAggregate });
  Object.assign(Notification, {
  findOneAndUpdate: original.notificationFindOneAndUpdate,
  });
});

test("networking validation rejects missing, malformed, and invalid pagination input", () => {
  for (const [schema, value] of [
    [sendConnectionRequestSchema, {}],
    [sendConnectionRequestSchema, { recipient: "not-an-id" }],
    [acceptConnectionRequestSchema, {}],
    [acceptConnectionRequestSchema, { connectionId: "123" }],
    [connectionStatusSchema, { userId: "bad" }],
    [followUserSchema, { userId: "bad" }],
    [getConnectionsSchema, { page: 0 }],
    [getConnectionsSchema, { limit: 51 }],
  ]) assert.ok(schema.validate(value).error);

  assert.equal(sendConnectionRequestSchema.validate({ recipient: ids.bob.toString() }).error, undefined);
  assert.deepEqual(getConnectionsSchema.validate({}).value, { page: 1, limit: 10 });
});

test("follow model rejects self-follow and keeps a directional uniqueness index", async () => {
  const selfFollow = new Follow({ follower: ids.alice, following: ids.alice });
  await assert.rejects(() => selfFollow.validate(), /cannot follow themselves/i);
  assert.ok(Follow.schema.indexes().some(([fields, options]) =>
    fields.follower === 1 && fields.following === 1 && options.unique === true
  ));
});

test("connection model keeps a partial unique index for active directional requests", () => {
  const indexes = JSON.stringify(Connection.schema.indexes());
  assert.match(indexes, /"requester":1,"recipient":1/);
  assert.match(indexes, /"unique":true/);
  assert.match(indexes, /"status":\{"\$in":\["pending","accepted"\]\}/);
});

test("send connection request enforces active accounts, self/duplicate restrictions, and a safe response", async () => {
  User.findById = async (userId) => userId.equals(ids.alice) ? activeUser(ids.alice) : activeUser(ids.bob);
  Connection.findOne = async () => null;
  Connection.create = async (document) => ({ _id: ids.connection, ...document, createdAt: new Date(), updatedAt: new Date(), respondedAt: null });
  let notification;
  Notification.findOneAndUpdate = async (...args) => { notification = args; };

  const created = await service.sendConnectionRequest(ids.alice, { recipient: ids.bob });
  assert.equal(created.status, "pending");
  assert.equal(created.requester.toString(), ids.alice.toString());
  assert.equal(notification[0].recipient.toString(), ids.bob.toString());
  assert.equal("password" in created, false);

  await assert.rejects(
    () => service.sendConnectionRequest(ids.alice, { recipient: ids.alice }),
    { statusCode: 400 }
  );
  Connection.findOne = async () => connection({ status: "accepted" });
  await assert.rejects(
    () => service.sendConnectionRequest(ids.alice, { recipient: ids.bob }),
    { statusCode: 409 }
  );
  Connection.findOne = async () => null;
  Connection.create = async () => { throw { code: 11000 }; };
  await assert.rejects(
    () => service.sendConnectionRequest(ids.alice, { recipient: ids.bob }),
    { statusCode: 409 }
  );
});

test("connection request transitions enforce recipient/requester authorization and pending-only state", async () => {
  const pending = connection();
  Connection.findById = async () => pending;
  let updateFilter;
  Connection.findOneAndUpdate = async (filter, update) => {
    updateFilter = filter;
    return { ...pending, status: update.$set.status, respondedAt: update.$set.respondedAt };
  };
  Notification.findOneAndUpdate = async () => null;

  const accepted = await service.acceptConnectionRequest(ids.bob, { connectionId: ids.connection });
  assert.equal(accepted.status, "accepted");
  assert.ok(accepted.respondedAt);
  assert.deepEqual(updateFilter, {
    _id: ids.connection,
    recipient: ids.bob,
    status: "pending",
  });

  const unauthorized = connection();
  Connection.findById = async () => unauthorized;
  await assert.rejects(
    () => service.acceptConnectionRequest(ids.charlie, { connectionId: ids.connection }),
    { statusCode: 403 }
  );
  await assert.rejects(
    () => service.cancelConnectionRequest(ids.bob, { connectionId: ids.connection }),
    { statusCode: 403 }
  );

  Connection.findById = async () => connection({ status: "accepted" });
  await assert.rejects(
    () => service.rejectConnectionRequest(ids.bob, { connectionId: ids.connection }),
    { statusCode: 400 }
  );
  Connection.findById = async () => null;
  await assert.rejects(
    () => service.cancelConnectionRequest(ids.alice, { connectionId: ids.connection }),
    { statusCode: 404 }
  );
});

test("remove connection permits only an accepted participant", async () => {
  const accepted = connection({ status: "accepted" });
  Connection.findById = async () => accepted;
  assert.deepEqual(await service.removeConnection(ids.alice, { connectionId: ids.connection }), { _id: ids.connection });
  assert.equal(accepted.deleted, true);

  Connection.findById = async () => connection({ status: "accepted" });
  await assert.rejects(
    () => service.removeConnection(ids.charlie, { connectionId: ids.connection }),
    { statusCode: 403 }
  );
  Connection.findById = async () => connection({ status: "pending" });
  await assert.rejects(
    () => service.removeConnection(ids.alice, { connectionId: ids.connection }),
    { statusCode: 400 }
  );
});

test("connection status reports none, directional pending state, accepted state, and rejects self", async () => {
  User.findById = async () => activeUser(ids.bob);
  Connection.findOne = async () => null;
  assert.deepEqual(await service.getConnectionStatus(ids.alice, { userId: ids.bob.toString() }), { status: "none" });
  Connection.findOne = async () => connection();
  assert.deepEqual(await service.getConnectionStatus(ids.alice, { userId: ids.bob.toString() }), { status: "pending_sent" });
  assert.deepEqual(await service.getConnectionStatus(ids.bob, { userId: ids.alice.toString() }), { status: "pending_received" });
  Connection.findOne = async () => connection({ status: "accepted" });
  assert.deepEqual(await service.getConnectionStatus(ids.alice, { userId: ids.bob.toString() }), { status: "accepted" });
  await assert.rejects(
    () => service.getConnectionStatus(ids.alice, { userId: ids.alice.toString() }),
    { statusCode: 400 }
  );
  User.findById = async () => ({ ...activeUser(ids.bob), accountStatus: "suspended" });
  await assert.rejects(
    () => service.getConnectionStatus(ids.alice, { userId: ids.bob.toString() }),
    { statusCode: 404 }
  );
});

test("connection and request lists return only safe counterpart profiles with pagination and pending counts", async () => {
  const profile = { _id: ids.bob, firstName: "Bob", lastName: "Lee", username: "bob", role: "professional", avatar: "" };
  const query = (rows) => ({
    populate() { return this; }, sort() { return this; }, skip() { return this; }, limit() { return this; },
    then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject); },
  });
  Connection.find = () => query([{ ...connection({ status: "accepted" }), requester: ids.alice, recipient: profile }]);
  Connection.countDocuments = async () => 1;
  const connections = await service.getConnections(ids.alice, { page: 1, limit: 10 });
  assert.deepEqual(connections.connections[0].user, profile);
  assert.equal(connections.pagination.totalConnections, 1);

  Connection.find = () => query([{ _id: ids.connection, requester: profile, createdAt: new Date() }]);
  const received = await service.getReceivedConnectionRequests(ids.alice, {});
  assert.deepEqual(received.requests[0].requester, profile);
  Connection.find = () => query([{ _id: ids.connection, recipient: profile, createdAt: new Date() }]);
  const sent = await service.getSentConnectionRequests(ids.alice, {});
  assert.deepEqual(sent.requests[0].recipient, profile);
  Connection.countDocuments = async () => 2;
  assert.deepEqual(await service.getReceivedConnectionRequestCount(ids.alice), { count: 2 });
});

test("mutual connections and suggestions exclude existing relationships and preserve pagination", async () => {
  User.findById = async () => activeUser(ids.bob);
  let pipelines = [];
  Connection.aggregate = async (pipeline) => {
    pipelines.push(pipeline);
    return pipeline.some((stage) => stage.$count)
      ? [{ totalUsers: 1 }]
      : [{ user: { _id: ids.charlie, firstName: "Charlie" } }];
  };
  const mutual = await service.getMutualConnections(ids.alice, { userId: ids.bob.toString() }, {});
  assert.equal(mutual.users[0]._id.toString(), ids.charlie.toString());
  assert.equal(mutual.pagination.totalUsers, 1);
  assert.ok(pipelines[0].some((stage) => stage.$match?.status === "accepted"));

  Connection.find = () => ({ select() { return this; }, lean: async () => [] });
  User.aggregate = async () => [{ users: [{ _id: ids.charlie }], metadata: [{ totalUsers: 1 }] }];
  const suggestions = await service.getConnectionSuggestions(ids.alice, { page: 1, limit: 10 }, "professional");
  assert.equal(suggestions.users[0]._id.toString(), ids.charlie.toString());
  assert.equal(suggestions.pagination.totalUsers, 1);
});

test("follow actions reject self, duplicate, and missing relationships while preserving counts/status", async () => {
  User.findById = async () => activeUser(ids.bob);
  Follow.findOne = async () => ({ _id: id("64b000000000000000000020") });
  await assert.rejects(() => service.followUser(ids.alice, { userId: ids.bob.toString() }), { statusCode: 409 });
  await assert.rejects(() => service.followUser(ids.alice, { userId: ids.alice.toString() }), { statusCode: 400 });

  Follow.findOne = async () => null;
  Follow.create = async (document) => ({ _id: id("64b000000000000000000020"), ...document, createdAt: new Date(), updatedAt: new Date() });
  Notification.findOneAndUpdate = async () => null;
  const follow = await service.followUser(ids.alice, { userId: ids.bob.toString() });
  assert.equal(follow.follower.toString(), ids.alice.toString());
  assert.equal(follow.following.toString(), ids.bob.toString());

  Follow.findOneAndDelete = async () => null;
  await assert.rejects(() => service.unfollowUser(ids.alice, { userId: ids.bob.toString() }), { statusCode: 404 });
  Follow.exists = async () => ({ _id: ids.connection });
  assert.deepEqual(await service.getFollowStatus(ids.alice, { userId: ids.bob.toString() }), { isFollowing: true });
  Follow.countDocuments = async (filter) => filter.following ? 3 : 4;
  assert.deepEqual(await service.getFollowCounts(ids.alice, { userId: ids.bob.toString() }), { followersCount: 3, followingCount: 4 });
});

test("every networking route is protected and inactive accounts are rejected", async () => {
  assert.equal(networkingRoutes.stack.length, 18);
  for (const layer of networkingRoutes.stack) {
    assert.ok(layer.route.stack.some((entry) => entry.handle === authenticateUser), layer.route.path);
  }
  const error = await new Promise((resolve) => {
    authenticateUser({ headers: {} }, {}, resolve);
  });
  assert.equal(error.statusCode, 401);
  assert.equal(error.message, "Access denied. No token provided.");
  assert.equal(JSON.stringify(error).match(/password|token|hash/i), null);

  const previousSecret = process.env.ACCESS_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_SECRET = "networking-test-secret";
  const token = jwt.sign({ _id: ids.alice.toString() }, process.env.ACCESS_TOKEN_SECRET);
  User.findById = async () => ({ _id: ids.alice, accountStatus: "suspended" });
  const inactiveError = await new Promise((resolve) => {
    authenticateUser({ headers: { authorization: `Bearer ${token}` } }, {}, resolve);
  });
  assert.equal(inactiveError.statusCode, 403);
  if (previousSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = previousSecret;
});

test("frontend RTK Query contract matches protected networking routes and invalidates related views", async () => {
  const source = await readFile(new URL("../../../frontend/src/redux/features/networking/networkingApi.ts", import.meta.url), "utf8");
  const connectionButton = await readFile(new URL("../../../frontend/src/components/networking/ConnectionButton.tsx", import.meta.url), "utf8");
  for (const route of [
    'url: "/networking/connections/request",', 'url: "/networking/connections/accept",',
    'url: "/networking/connections/reject",', 'url: "/networking/connections/cancel",',
    'url: "/networking/connections",', 'url: "/networking/followers",',
    'url: "/networking/following",', 'url: "/networking/connections/suggestions",',
  ]) assert.ok(source.includes(route), route);
  for (const tag of ["ConnectionRequests", "ConnectionStatus", "ConnectionSuggestions", "FollowStatus", "FollowCount", "FollowList"]) {
    assert.ok(source.includes(tag), tag);
  }
  assert.match(connectionButton, /sendRequest\(\{ recipient: userId \}\)/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /method: "DELETE"/);
});
