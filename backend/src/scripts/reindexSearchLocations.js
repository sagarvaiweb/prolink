import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { Company } from "../models/Company.model.js";
import { Job } from "../models/Job.model.js";
import { Profile } from "../models/Profile.model.js";
import { SearchDocument } from "../models/SearchDocument.model.js";
import { getLocationTerms } from "../modules/search/search.location.js";

const sources = {
  person: {
    model: Profile,
    projection: "user location",
    map: (record) => ({ entityId: record.user, location: record.location }),
  },
  job: {
    model: Job,
    projection: "_id location",
    map: (record) => ({ entityId: record._id, location: record.location }),
  },
  company: {
    model: Company,
    projection: "_id location",
    map: (record) => ({ entityId: record._id, location: record.location }),
  },
};

const configuredBatchSize = Number(process.env.SEARCH_REINDEX_BATCH_SIZE || 50);
const batchSize =
  Number.isInteger(configuredBatchSize) && configuredBatchSize > 0
    ? Math.min(configuredBatchSize, 500)
    : 50;

const updateLocations = async (type, source) => {
  const cursor = source.model.find({}).select(source.projection).lean().cursor();
  let operations = [];
  let scanned = 0;
  let modified = 0;

  const flush = async () => {
    if (!operations.length) return;

    const result = await SearchDocument.bulkWrite(operations, { ordered: false });
    modified += result.modifiedCount;
    operations = [];
  };

  for await (const record of cursor) {
    const { entityId, location } = source.map(record);
    if (!entityId) continue;

    operations.push({
      updateOne: {
        filter: { entityType: type, entityId },
        update: { $set: { "metadata.location": getLocationTerms(location) } },
      },
    });
    scanned += 1;

    if (operations.length >= batchSize) await flush();
  }

  await flush();
  console.log(`Updated ${type} locations: scanned ${scanned}, changed ${modified}.`);
};

try {
  await connectDB();

  for (const [type, source] of Object.entries(sources)) {
    await updateLocations(type, source);
  }
} catch (error) {
  console.error("Search location migration failed.", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
