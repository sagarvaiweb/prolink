import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import { Company } from "../models/Company.model.js";
import { Job } from "../models/Job.model.js";
import { Post } from "../models/Post.model.js";
import { Profile } from "../models/Profile.model.js";
import { RecentSearch } from "../models/RecentSearch.model.js";
import { SearchDocument } from "../models/SearchDocument.model.js";
import { getSearchEmbeddingConfig } from "../modules/search/search.embedding.service.js";
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
const types = [
  ...new Set(requestedTypes.length ? requestedTypes : Object.keys(sources)),
];
const configuredBatchSize = Number(process.env.SEARCH_REINDEX_BATCH_SIZE || 50);
const batchSize =
  Number.isInteger(configuredBatchSize) && configuredBatchSize > 0
    ? Math.min(configuredBatchSize, 500)
    : 50;

if (types.some((type) => !sources[type])) {
  console.error(
    `Usage: node src/scripts/reindexSearchDocuments.js ` +
      `[${Object.keys(sources).join("|")}]`
  );
  process.exitCode = 1;
} else {
  try {
    await connectDB();
    await Promise.all([
      SearchDocument.createIndexes(),
      RecentSearch.createIndexes(),
    ]);

    for (const type of types) {
      const { model, projection, map } = sources[type];
      let batch = [];
      let scanned = 0;
      const cursor = model.find({}).select(projection).lean().cursor();

      for await (const record of cursor) {
        batch.push(map(record));

        if (batch.length >= batchSize) {
          await syncBatch(type, batch);
          scanned += batch.length;
          batch = [];

          console.log(`Reindexed ${type}: scanned ${scanned}.`);
        }
      }

      if (batch.length) {
        await syncBatch(type, batch);
        scanned += batch.length;
      }

      const embeddingConfig = getSearchEmbeddingConfig();
      const activeFilter = { entityType: type, isActive: true };
  const [activeDocuments, embeddedDocuments] = await Promise.all([
        SearchDocument.countDocuments(activeFilter),
        SearchDocument.countDocuments({
          ...activeFilter,
          embeddingModel: embeddingConfig.model,
          embeddingVersion: embeddingConfig.version,
          embedding: { $exists: true },
        }),
      ]);
      const missingEmbeddings = Math.max(activeDocuments - embeddedDocuments, 0);
      const coverage = activeDocuments
        ? Math.round((embeddedDocuments / activeDocuments) * 100)
        : null;

      console.log(
        `Completed ${type}: scanned ${scanned}, active ${activeDocuments}, ` +
          `embedded ${embeddedDocuments}, missing embeddings ${missingEmbeddings}, ` +
          `coverage ${coverage === null ? "n/a" : `${coverage}%`}.`
      );
    }
  } catch (error) {
    console.error("Search document reindex failed.", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
