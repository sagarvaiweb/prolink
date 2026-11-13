import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import { Company } from "../../models/Company.model.js";
import { Job } from "../../models/Job.model.js";
import { Post } from "../../models/Post.model.js";
import { Profile } from "../../models/Profile.model.js";
import { indexCompany, indexJobDocument, indexPost, indexProfile } from "./searchDocument.service.js";

const reindex = async (model, indexer, label) => {
  let count = 0;
  for await (const document of model.find().lean().cursor()) {
    await indexer(document);
    count += 1;
  }
  console.log(`Indexed ${count} ${label} documents.`);
};

try {
  await connectDB();
  await reindex(Profile, indexProfile, "profile");
  await reindex(Post, indexPost, "post");
  await reindex(Company, indexCompany, "company");
  await reindex(Job, indexJobDocument, "job");
} catch (error) {
  console.error("Search index rebuild failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
