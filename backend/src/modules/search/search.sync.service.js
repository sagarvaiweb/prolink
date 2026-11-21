import { Company } from "../../models/Company.model.js";
import { Job } from "../../models/Job.model.js";
import { Post } from "../../models/Post.model.js";
import { Profile } from "../../models/Profile.model.js";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { User } from "../../models/User.model.js";

const MODEL_TYPES = {
  Profile: "person",
  User: "person",
  Job: "job",
  Post: "post",
  Company: "company",
};

const EMBEDDING_MODEL =
  process.env.SEARCH_EMBEDDING_MODEL ||
  "sentence-transformers/all-MiniLM-L6-v2";
const EMBEDDING_VERSION = process.env.SEARCH_EMBEDDING_VERSION || "v1";
const DIMENSIONS = Number(process.env.SEARCH_VECTOR_DIMENSIONS || 384);
const AI_TIMEOUT_MS = Number(process.env.SEARCH_AI_TIMEOUT_MS || 3000);

const clean = (values) =>
  values
    .filter(
      (value) =>
        value !== null && value !== undefined && String(value).trim()
    )
    .map((value) => String(value).trim());

const makeText = (...values) => clean(values).join(" ").slice(0, 30000);

const getEmbeddingUrl = () =>
  `${process.env.AI_SERVICE_URL.replace(/\/$/, "")}/embeddings`;

const getEmbeddingHeaders = () => ({
  "content-type": "application/json",
  ...(process.env.AI_SERVICE_TOKEN
    ? { authorization: `Bearer ${process.env.AI_SERVICE_TOKEN}` }
    : {}),
});

const requestEmbeddings = async (texts) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(getEmbeddingUrl(), {
      method: "POST",
      headers: getEmbeddingHeaders(),
      body: JSON.stringify({ texts }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Embedding service returned ${response.status}.`);
    }

    const payload = await response.json();
    const vectors = payload.embeddings;
    const validVectors =
      Array.isArray(vectors) &&
      vectors.length === texts.length &&
      vectors.every(
        (vector) =>
          Array.isArray(vector) &&
          vector.length === DIMENSIONS &&
          vector.every(Number.isFinite)
      );

    if (!validVectors) {
      throw new Error(
        `Embedding response must contain ${texts.length} vectors of ${DIMENSIONS} dimensions.`
      );
    }

    return {
      vectors,
      model: payload.model || EMBEDDING_MODEL,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const embedSafely = async (texts) => {
  if (!process.env.AI_SERVICE_URL) return null;

  try {
    return await requestEmbeddings(texts);
  } catch (error) {
    console.error("Search embeddings are unavailable; saving text only.", error);
    return null;
  }
};

const buildPersonDocument = async (userId) => {
  const [profile, user] = await Promise.all([
    Profile.findOne({ user: userId }).lean(),
    User.findById(userId)
      .select("firstName lastName username role accountStatus")
      .lean(),
  ]);

  if (
    !profile ||
    !user ||
    user.accountStatus !== "active" ||
    profile.visibility === "private"
  ) {
    return null;
  }

  const experience = (profile.experience || []).flatMap((item) => [
    item.title,
    item.company,
    item.description,
  ]);
  const education = (profile.education || []).flatMap((item) => [
    item.degree,
    item.fieldOfStudy,
    item.school,
  ]);
  const skills = profile.skills || [];

  return {
    entityId: userId,
    entityType: "person",
    searchableText: makeText(
      "Name:",
      user.firstName,
      user.lastName,
      "Username:",
      user.username,
      "Headline:",
      profile.headline,
      "Bio:",
      profile.bio,
      "Skills:",
      ...skills,
      "Experience:",
      ...experience,
      "Education:",
      ...education,
      "Location:",
      profile.location
    ),
    metadata: {
      role: user.role || null,
      title: profile.headline || null,
      location: profile.location || null,
      skills,
      visibility: profile.visibility || "public",
    },
  };
};

const buildJobDocument = async (jobId) => {
  const job = await Job.findById(jobId).lean();

  if (!job || job.status !== "open" || job.moderationStatus !== "approved") {
    return null;
  }

  if (
    job.postedByCompany &&
    !(await Company.exists({ _id: job.postedByCompany, isSuspended: false }))
  ) {
    return null;
  }

  if (!job.postedByCompany) {
    const posterId = job.postedByUser || job.postedBy;
    if (
      !posterId ||
      !(await User.exists({ _id: posterId, accountStatus: "active" }))
    ) {
      return null;
    }
  }

  const company = job.postedByCompany
    ? await Company.findById(job.postedByCompany)
        .select("name industry")
        .lean()
    : null;
  const requiredSkills = job.requiredSkills || [];

  return {
    entityId: jobId,
    entityType: "job",
    searchableText: makeText(
      "Job Title:",
      job.title,
      "Description:",
      job.description,
      "Required Skills:",
      ...requiredSkills,
      "Experience Level:",
      job.experienceLevel,
      "Employment Type:",
      job.jobType,
      "Location:",
      job.location,
      "Company:",
      company?.name
    ),
    metadata: {
      location: job.location || null,
      skills: requiredSkills,
      experienceLevel: job.experienceLevel || null,
      employmentType: job.jobType || null,
      salaryRange: job.salaryRange || null,
      industry: company?.industry || null,
      postedById: job.postedByCompany
        ? null
        : job.postedByUser || job.postedBy || null,
      companyId: job.postedByCompany || null,
    },
  };
};

const buildPostDocument = async (postId) => {
  const post = await Post.findById(postId).lean();

  if (
    !post ||
    post.visibility !== "public" ||
    !(await User.exists({ _id: post.author, accountStatus: "active" }))
  ) {
    return null;
  }

  return {
    entityId: postId,
    entityType: "post",
    searchableText: makeText("Post Content:", post.content),
    metadata: {
      visibility: post.visibility,
      authorId: post.author,
      createdAt: post.createdAt,
    },
  };
};

const buildCompanyDocument = async (companyId) => {
  const company = await Company.findById(companyId).lean();

  if (!company || company.isSuspended) return null;

  return {
    entityId: companyId,
    entityType: "company",
    searchableText: makeText(
      "Company:",
      company.name,
      "Industry:",
      company.industry,
      "Description:",
      company.description,
      "Location:",
      company.location
    ),
    metadata: {
      location: company.location || null,
      industry: company.industry || null,
    },
  };
};

const documentFor = async (type, id) => {
  if (type === "person") return buildPersonDocument(id);
  if (type === "job") return buildJobDocument(id);
  if (type === "post") return buildPostDocument(id);
  if (type === "company") return buildCompanyDocument(id);

  return null;
};

const deactivateEntity = async (type, id) => {
  await SearchDocument.updateOne(
    { entityType: type, entityId: id },
    { $set: { isActive: false } }
  );
};

const upsertDocument = async (document, embedding) => {
  const update = {
    ...document,
    isActive: true,
    embeddingModel: embedding?.model || null,
    embeddingVersion: embedding ? EMBEDDING_VERSION : null,
  };

  if (embedding) update.embedding = embedding.vector;

  await SearchDocument.updateOne(
    { entityType: document.entityType, entityId: document.entityId },
    {
      $set: update,
      ...(!embedding ? { $unset: { embedding: 1 } } : {}),
    },
    { upsert: true, runValidators: true }
  );
};

export const syncEntity = async (type, id) => {
  const document = await documentFor(type, id);

  if (!document) {
    await deactivateEntity(type, id);
    return { indexed: false };
  }

  let embedding = null;
  const result = await embedSafely([document.searchableText]);

  if (result) {
    embedding = {
      vector: result.vectors[0],
      model: result.model,
    };
  }

  await upsertDocument(document, embedding);

  return { indexed: true, embedded: Boolean(embedding) };
};

export const syncModelEntities = async (modelName, ids, options = {}) => {
  const type = MODEL_TYPES[modelName];
  if (!type) return;

  for (const id of [...new Set(ids.map(String))]) {
    try {
      await syncEntity(type, id);

      if (options.syncRelatedPosts && modelName === "User") {
        await syncRelatedEntities("post", Post, { author: id });
      }

      if (options.syncRelatedUserJobs && modelName === "User") {
        await syncRelatedEntities("job", Job, {
          postedByCompany: null,
          $or: [{ postedBy: id }, { postedByUser: id }],
        });
      }

      if (options.syncRelatedJobs && modelName === "Company") {
        await syncRelatedEntities("job", Job, { postedByCompany: id });
      }
    } catch (error) {
      console.error(`Could not sync ${type} search document ${id}.`, error);
    }
  }
};

export const deactivateModelEntities = async (modelName, ids) => {
  const type = MODEL_TYPES[modelName];
  if (!type || !ids.length) return;

  const filters = [{ entityType: type, entityId: { $in: ids } }];

  if (modelName === "User") {
    filters.push({ entityType: "post", "metadata.authorId": { $in: ids } });
    filters.push({ entityType: "job", "metadata.postedById": { $in: ids } });
  }

  if (modelName === "Company") {
    filters.push({ entityType: "job", "metadata.companyId": { $in: ids } });
  }

  await SearchDocument.updateMany(
    { $or: filters },
    { $set: { isActive: false } }
  );
};

const syncRelatedEntities = async (type, model, filter) => {
  const batchSize = 50;
  const cursor = model.find(filter).select("_id").lean().cursor();
  let batch = [];

  for await (const record of cursor) {
    batch.push(record);

    if (batch.length >= batchSize) {
      await syncBatch(type, batch);
      batch = [];
    }
  }

  if (batch.length) await syncBatch(type, batch);
};

export const syncBatch = async (type, records) => {
  const documents = [];

  for (const record of records) {
    const document = await documentFor(type, record._id);

    if (document) {
      documents.push(document);
    } else {
      await deactivateEntity(type, record._id);
    }
  }

  if (!documents.length) return 0;

  const embeddingResult = await embedSafely(
    documents.map(({ searchableText }) => searchableText)
  );
  const vectors = embeddingResult?.vectors;

  const operations = documents.map((document, index) => {
    const vector = vectors?.[index];
    const update = {
      $set: {
        ...document,
        isActive: true,
        embeddingModel: vector ? embeddingResult.model : null,
        embeddingVersion: vector ? EMBEDDING_VERSION : null,
        ...(vector ? { embedding: vector } : {}),
      },
    };

    if (!vector) update.$unset = { embedding: 1 };

    return {
      updateOne: {
        filter: {
          entityType: type,
          entityId: document.entityId,
        },
        update,
        upsert: true,
      },
    };
  });

  await SearchDocument.bulkWrite(operations, { ordered: false });

  return documents.length;
};
