import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { Company } from "../models/Company.model.js";
import { Job } from "../models/Job.model.js";
import { Post } from "../models/Post.model.js";
import { Profile } from "../models/Profile.model.js";
import { syncBatch } from "../modules/search/search.sync.service.js";

const sources = {
  person: {
    model: Profile,
    projection: "user",
    map: (profile) => ({ _id: profile.user }),
  },
  job: {
    model: Job,
    projection: "_id",
    map: (record) => record,
  },
  post: {
    model: Post,
    projection: "_id",
    map: (record) => record,
  },
  company: {
    model: Company,
    projection: "_id",
    map: (record) => record,
  },
};

const requestedTypes = process.argv.slice(2).filter((value) => value !== "--");
const types = requestedTypes.length ? requestedTypes : Object.keys(sources);
const batchSize = Math.min(
  500,
  Math.max(1, Number(process.env.SEARCH_REINDEX_BATCH_SIZE || 50))
);

if (types.some((type) => !sources[type])) {
  console.error(
    `Usage: node src/scripts/reindexSearchDocuments.js [${Object.keys(sources).join("|")}]`
  );
  process.exitCode = 1;
} else {
  try {
    await connectDB();

    for (const type of types) {
      const { model, projection, map } = sources[type];
      let batch = [];
      let scanned = 0;
      let indexed = 0;
      const cursor = model.find({}).select(projection).lean().cursor();

      for await (const record of cursor) {
        batch.push(map(record));

        if (batch.length >= batchSize) {
          indexed += await syncBatch(type, batch);
          scanned += batch.length;
          batch = [];

          console.log(`Reindexed ${type}: scanned ${scanned}, active ${indexed}.`);
        }
      }

      if (batch.length) {
        indexed += await syncBatch(type, batch);
        scanned += batch.length;
      }

      console.log(`Completed ${type}: scanned ${scanned}, active ${indexed}.`);
    }
  } catch (error) {
    console.error("Search document reindex failed.", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
