import { SearchDocument } from "../../models/SearchDocument.model.js";
import { Job } from "../../models/Job.model.js";
import { Company } from "../../models/Company.model.js";
import ApiError from "../../utils/ApiError.js";
import { embedText, cosineSimilarity } from "./embedding.service.js";

const tokenize = (text) => [...new Set(String(text).toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) ?? [])];

const lexicalScore = (queryTokens, text) => {
  const documentTokens = new Set(tokenize(text));
  if (!queryTokens.length) return 0;
  return queryTokens.reduce((score, token) => score + (documentTokens.has(token) ? 1 : 0), 0) / queryTokens.length;
};

export const searchJobs = async (user, { q, page = 1, limit = 10 }) => {
  const queryText = q.trim();
  if (user.accountStatus !== "active") throw new ApiError(403, "Your account is not active.");
  let queryEmbedding = null;
  try {
    queryEmbedding = await embedText(queryText);
  } catch (error) {
    console.error("Search query embedding failed; using lexical ranking:", error.message);
  }
  const queryTokens = tokenize(queryText);
  const filter = { entityType: "job", isSearchable: true };
  if (!queryEmbedding) {
    filter.$or = queryTokens.map((token) => ({
      text: { $regex: token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
    }));
  }
  const documents = await SearchDocument.find(filter)
    .sort(queryEmbedding ? { updatedAt: -1 } : {})
    .select("entityId text embedding")
    .limit(2000)
    .lean();
  if (!documents.length) {
    return { jobs: [], pagination: { total: 0, page, limit, totalPages: 0 }, scoring: queryEmbedding ? "embedding" : "lexical" };
  }

  const activeCompanyIds = await Company.distinct("_id", { isSuspended: false });
  const jobs = await Job.find({
    _id: { $in: documents.map(({ entityId }) => entityId) },
    status: "open",
    moderationStatus: "approved",
    $or: [
      { postedByCompany: { $exists: false } },
      { postedByCompany: null },
      { postedByCompany: { $in: activeCompanyIds } },
    ],
  })
    .populate([
      { path: "postedByCompany", select: "name logo industry website isVerified isSuspended" },
      { path: "postedByUser", select: "firstName lastName username avatar" },
      { path: "postedBy", select: "firstName lastName username avatar" },
    ])
    .lean();

  const documentById = new Map(documents.map((document) => [String(document.entityId), document]));
  const ranked = jobs.map((job) => {
    const document = documentById.get(String(job._id));
    const semantic = queryEmbedding ? cosineSimilarity(queryEmbedding.vector, document?.embedding) : null;
    const score = semantic === null ? lexicalScore(queryTokens, document?.text ?? "") : (semantic + 1) / 2;
    return {
      ...job,
      postedBy: job.postedByUser ?? job.postedBy ?? null,
      company: job.postedByCompany ?? null,
      searchScore: Number(score.toFixed(4)),
    };
  }).filter(({ searchScore }) => searchScore > 0)
    .sort((left, right) => right.searchScore - left.searchScore || new Date(right.createdAt) - new Date(left.createdAt));

  const start = (page - 1) * limit;
  const selected = ranked.slice(start, start + limit);
  return {
    jobs: selected,
    pagination: { total: ranked.length, page, limit, totalPages: Math.ceil(ranked.length / limit) },
    scoring: queryEmbedding ? "embedding" : "lexical",
  };
};
