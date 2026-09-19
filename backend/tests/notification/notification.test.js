import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  ensureNotificationIndexes,
  Notification,
  NOTIFICATION_TYPES,
} from "../../src/models/Notification.model.js";
import { User } from "../../src/models/User.model.js";
import authenticateUser from "../../src/middlewares/authenticateUser.middleware.js";
import notificationRoutes from "../../src/modules/notification/notification.routes.js";
import * as service from "../../src/modules/notification/notification.service.js";
import {
  getNotificationsSchema,
  notificationIdSchema,
} from "../../src/modules/notification/notification.validation.js";

const id = (value) => new mongoose.Types.ObjectId(value);
const ids = {
  alice: id("64b000000000000000000001"),
  bob: id("64b000000000000000000002"),
  notification: id("64b000000000000000000010"),
};

const original = {
  notificationFind: Notification.find,
  notificationFindOneAndUpdate: Notification.findOneAndUpdate,
  notificationCountDocuments: Notification.countDocuments,
  notificationCreateIndexes: Notification.createIndexes,
  notificationCollectionIndexes: Notification.collection.indexes,
  notificationCollectionDropIndex: Notification.collection.dropIndex,
  userFindById: User.findById,
};

test.afterEach(() => {
  Object.assign(Notification, {
    find: original.notificationFind,
    findOneAndUpdate: original.notificationFindOneAndUpdate,
    countDocuments: original.notificationCountDocuments,
    createIndexes: original.notificationCreateIndexes,
  });
  Notification.collection.indexes = original.notificationCollectionIndexes;
  Notification.collection.dropIndex = original.notificationCollectionDropIndex;
  User.findById = original.userFindById;
});

test("notification indexes keep uniqueness per concrete connection or follow event", async () => {
  const indexes = Notification.schema.indexes();
  assert.ok(indexes.some(([fields, options]) =>
    fields.recipient === 1 &&
    fields.type === 1 &&
    fields.connection === 1 &&
    options.unique === true &&
    options.partialFilterExpression?.connection?.$type === "objectId"
  ));
  assert.ok(indexes.some(([fields, options]) =>
    fields.recipient === 1 &&
    fields.type === 1 &&
    fields.follow === 1 &&
    options.unique === true &&
    options.partialFilterExpression?.follow?.$type === "objectId"
  ));

  const droppedIndexes = [];
  let createIndexesCalled = false;
  Notification.collection.indexes = async () => [
    { name: "_id_", key: { _id: 1 } },
    {
      name: "recipient_1_type_1_connection_1",
      key: { recipient: 1, type: 1, connection: 1 },
      unique: true,
    },
    {
      name: "recipient_1_type_1_follow_1",
      key: { recipient: 1, type: 1, follow: 1 },
      unique: true,
      partialFilterExpression: { follow: { $type: "objectId" } },
    },
  ];
  Notification.collection.dropIndex = async (indexName) => { droppedIndexes.push(indexName); };
  Notification.createIndexes = async () => { createIndexesCalled = true; };

  await ensureNotificationIndexes();
  assert.deepEqual(droppedIndexes, ["recipient_1_type_1_connection_1"]);
  assert.equal(createIndexesCalled, true);
});

test("follow notifications are unique per follow event while connection events stay unique", async () => {
  const followOne = id("64b000000000000000000020");
  const followTwo = id("64b000000000000000000021");
  const connection = id("64b000000000000000000030");
  const notifications = new Map();
  const upsertFilters = [];

  Notification.findOneAndUpdate = async (filter, update) => {
    upsertFilters.push(filter);
    const eventId = filter.follow ?? filter.connection;
    const eventField = filter.follow ? "follow" : "connection";
    const key = `${filter.recipient}:${filter.type}:${eventField}:${eventId}`;

    if (!notifications.has(key)) {
      notifications.set(key, { _id: id(`64b0000000000000000000${notifications.size + 40}`), ...update.$setOnInsert });
    }

    return notifications.get(key);
  };

  const firstFollow = await service.createFollowNotification({
    recipient: ids.alice,
    actor: ids.bob,
    type: NOTIFICATION_TYPES.FOLLOW_RECEIVED,
    follow: followOne,
  });
  const secondFollow = await service.createFollowNotification({
    recipient: ids.alice,
    actor: id("64b000000000000000000003"),
    type: NOTIFICATION_TYPES.FOLLOW_RECEIVED,
    follow: followTwo,
  });
  const repeatedFirstFollow = await service.createFollowNotification({
    recipient: ids.alice,
    actor: ids.bob,
    type: NOTIFICATION_TYPES.FOLLOW_RECEIVED,
    follow: followOne,
  });
  const connectionNotification = await service.createConnectionNotification({
    recipient: ids.alice,
    actor: ids.bob,
    type: NOTIFICATION_TYPES.CONNECTION_REQUEST_RECEIVED,
    connection,
  });

  assert.notEqual(firstFollow._id.toString(), secondFollow._id.toString());
  assert.equal(repeatedFirstFollow._id.toString(), firstFollow._id.toString());
  assert.equal(notifications.size, 3);
  assert.deepEqual(upsertFilters[0], {
    recipient: ids.alice,
    type: NOTIFICATION_TYPES.FOLLOW_RECEIVED,
    follow: followOne,
  });
  assert.deepEqual(upsertFilters[3], {
    recipient: ids.alice,
    type: NOTIFICATION_TYPES.CONNECTION_REQUEST_RECEIVED,
    connection,
  });
  assert.equal(connectionNotification.connection.toString(), connection.toString());
});

test("notification validation rejects invalid IDs and invalid pagination", () => {
  assert.ok(notificationIdSchema.validate({ notificationId: "invalid" }).error);
  assert.ok(getNotificationsSchema.validate({ page: 0 }).error);
  assert.ok(getNotificationsSchema.validate({ limit: 51 }).error);
  assert.equal(
    notificationIdSchema.validate({ notificationId: ids.notification.toString() }).error,
    undefined
  );
  assert.deepEqual(getNotificationsSchema.validate({}).value, { page: 1, limit: 10 });
});

test("notifications list only the recipient's safe notifications with pagination", async () => {
  const actor = {
    _id: ids.bob,
    firstName: "Bob",
    lastName: "Lee",
    username: "bob",
    role: "professional",
    avatar: "",
    email: "private@example.com",
  };
  const query = {
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    then(resolve, reject) {
      return Promise.resolve([{
        _id: ids.notification,
        actor,
        type: "follow_received",
        message: "You have a new follower.",
        isRead: false,
        createdAt: new Date("2025-01-01"),
        recipient: ids.alice,
      }]).then(resolve, reject);
    },
  };
  let listFilter;
  Notification.find = (filter) => {
    listFilter = filter;
    return query;
  };
  Notification.countDocuments = async () => 1;

  const result = await service.getNotifications(ids.alice, { page: 1, limit: 10 });
  assert.deepEqual(listFilter, { recipient: ids.alice });
  assert.equal(result.pagination.totalNotifications, 1);
  assert.equal(result.notifications[0].actor.email, undefined);
  assert.deepEqual(Object.keys(result.notifications[0]).sort(), [
    "_id", "actor", "createdAt", "isRead", "message", "type",
  ]);
});

test("unread counts and read updates are recipient-scoped", async () => {
  let countFilter;
  Notification.countDocuments = async (filter) => {
    countFilter = filter;
    return 2;
  };
  assert.deepEqual(await service.getUnreadNotificationCount(ids.alice), { count: 2 });
  assert.deepEqual(countFilter, { recipient: ids.alice, isRead: false });

  const actor = { _id: ids.bob, firstName: "Bob", lastName: "Lee", username: "bob", role: "professional", avatar: "" };
  let updateFilter;
  Notification.findOneAndUpdate = (filter) => {
    updateFilter = filter;
    return {
      populate: async () => ({
        _id: ids.notification,
        actor,
        type: "follow_received",
        message: "You have a new follower.",
        isRead: true,
        createdAt: new Date("2025-01-01"),
      }),
    };
  };
  const updated = await service.markNotificationAsRead(ids.alice, {
    notificationId: ids.notification.toString(),
  });
  assert.deepEqual(updateFilter, { _id: ids.notification.toString(), recipient: ids.alice });
  assert.equal(updated.isRead, true);

  Notification.findOneAndUpdate = () => ({ populate: async () => null });
  await assert.rejects(
    () => service.markNotificationAsRead(ids.bob, { notificationId: ids.notification.toString() }),
    { statusCode: 404 }
  );
});

test("notification routes are protected and unauthenticated access is rejected", async () => {
  assert.equal(notificationRoutes.stack.length, 3);
  for (const layer of notificationRoutes.stack) {
    assert.ok(layer.route.stack.some((entry) => entry.handle === authenticateUser));
  }

  const error = await new Promise((resolve) => {
    authenticateUser({ headers: {} }, {}, resolve);
  });
  assert.equal(error.statusCode, 401);

  const previousSecret = process.env.ACCESS_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_SECRET = "notification-test-secret";
  const token = jwt.sign({ _id: ids.alice.toString() }, process.env.ACCESS_TOKEN_SECRET);
  User.findById = async () => ({ _id: ids.alice, accountStatus: "active" });
  const request = { headers: { authorization: `Bearer ${token}` } };
  await new Promise((resolve, reject) => authenticateUser(request, {}, (error) => error ? reject(error) : resolve()));
  assert.equal(request.user._id.toString(), ids.alice.toString());
  if (previousSecret === undefined) delete process.env.ACCESS_TOKEN_SECRET;
  else process.env.ACCESS_TOKEN_SECRET = previousSecret;
});
