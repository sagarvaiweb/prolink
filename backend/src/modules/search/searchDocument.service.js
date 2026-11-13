import { createHash } from "node:crypto";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { User } from "../../models/User.model.js";
import { Company } from "../../models/Company.model.js";
import { embedText } from "./embedding.service.js";

const hashText = (text) => createHash("sha256").update(text).digest("hex");

export const upsertSearchDocument = async ({ entityType, entityId, text, metadata = {}, isSearchable = true }) => {
  const normalizedText = String(text ?? "").replace(/\s+/g, " ").trim().slice(0, 30000);
  if (!normalizedText) return deleteSearchDocument(entityType, entityId);

  const contentHash = hashText(normalizedText);
  const existing = await SearchDocument.findOne({ entityType, entityId }).select("contentHash embedding").lean();
  if (existing?.contentHash === contentHash && (existing.embedding?.length || !process.env.EMBEDDING_API_URL)) {
    await SearchDocument.updateOne({ entityType, entityId }, { $set: { metadata, isSearchable } });
    return;
  }

  let generated = null;
  try {
    generated = await embedText(normalizedText);
  } catch (error) {
    // Keep the lexical document current if an optional embedding service is unavailable.
    console.error("Search embedding generation failed; saved lexical document instead:", error.message);
  }
  const update = {
    $set: {
      text: normalizedText,
      contentHash,
      metadata,
      isSearchable,
    },
  };
  if (generated) {
    Object.assign(update.$set, {
      embedding: generated.vector,
      embeddingProvider: generated.provider,
      embeddingModel: generated.model,
    });
  } else {
    update.$unset = { embedding: 1, embeddingProvider: 1, embeddingModel: 1 };
  }

  await SearchDocument.updateOne(
    { entityType, entityId },
    update,
    { upsert: true }
  );
};

export const deleteSearchDocument = async (entityType, entityId) =>
  SearchDocument.deleteOne({ entityType, entityId });

export const setSearchable = async (entityType, entityId, isSearchable) =>
  SearchDocument.updateOne({ entityType, entityId }, { $set: { isSearchable } });

export const indexProfile = async (profile) => {
  const user = await User.findById(profile.user).select("firstName lastName username role accountStatus").lean();
  return upsertSearchDocument({
    entityType: "profile",
    entityId: profile._id,
    text: [user?.firstName, user?.lastName, user?.username, user?.role, profile.headline, profile.bio, profile.location, ...(profile.skills ?? []), ...(profile.experience ?? []).flatMap((item) => [item.title, item.company, item.description]), ...(profile.education ?? []).flatMap((item) => [item.degree, item.fieldOfStudy, item.school])].filter(Boolean).join(" "),
    metadata: { userId: String(profile.user), visibility: profile.visibility },
    isSearchable: user?.accountStatus === "active" && profile.visibility === "public",
  });
};

export const indexPost = async (post) => {
  const user = await User.findById(post.author).select("accountStatus").lean();
  return upsertSearchDocument({
    entityType: "post",
    entityId: post._id,
    text: post.content,
    metadata: { authorId: String(post.author), visibility: post.visibility },
    isSearchable: user?.accountStatus === "active" && post.visibility === "public",
  });
};

export const indexCompany = async (company) => upsertSearchDocument({
  entityType: "company",
  entityId: company._id,
  text: [company.name, company.description, company.industry, company.location].filter(Boolean).join(" "),
  metadata: { industry: company.industry },
  isSearchable: !company.isSuspended,
});

export const indexJobDocument = async (job, { isSearchable } = {}) => {
  const company = job.postedByCompany && typeof job.postedByCompany === "object"
    ? job.postedByCompany
    : job.postedByCompany ? await Company.findById(job.postedByCompany).select("name industry isSuspended").lean() : null;
  return upsertSearchDocument({
    entityType: "job",
    entityId: job._id,
    text: [job.title, job.description, ...(job.requiredSkills ?? []), job.location, job.experienceLevel, job.jobType, company?.name, company?.industry, job.isRemote ? "remote" : ""].filter(Boolean).join(" "),
    metadata: { status: job.status, moderationStatus: job.moderationStatus },
    isSearchable: (isSearchable ?? (job.status === "open" && job.moderationStatus === "approved")) && !company?.isSuspended,
  });
};
