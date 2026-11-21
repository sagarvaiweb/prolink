import mongoose from "mongoose";
import { Company } from "../../models/Company.model.js";
import { Job } from "../../models/Job.model.js";
import { Post } from "../../models/Post.model.js";
import { Profile } from "../../models/Profile.model.js";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { User } from "../../models/User.model.js";
import ApiError from "../../utils/ApiError.js";
import {
  createEmbeddings,
  getSearchEmbeddingConfig,
} from "./search.embedding.service.js";
import { reciprocalRankFusion } from "./search.ranking.service.js";

const ENTITY_TYPES = {
  people: "person",
  jobs: "job",
  posts: "post",
  companies: "company",
};

const FILTERS_BY_TYPE = {
  people: ["location", "skills", "role", "title"],
  jobs: [
    "location",
    "skills",
    "experienceLevel",
    "employmentType",
    "salaryRange",
    "industry",
  ],
  posts: ["author", "dateFrom", "dateTo", "visibility"],
  companies: ["location", "industry"],
};

const SEARCH_INDEX =
  process.env.SEARCH_TEXT_INDEX || "searchdocument_text_index";
const VECTOR_INDEX =
  process.env.SEARCH_VECTOR_INDEX || "searchdocument_vector_index";
const configuredRrfConstant = Number(process.env.SEARCH_RRF_K || 60);
const RRF_CONSTANT =
  Number.isFinite(configuredRrfConstant) && configuredRrfConstant > 0
    ? configuredRrfConstant
    : 60;
const MAX_CANDIDATES = 10000;

const buildAtlasTypeFilter = (type, query) => {
  const supportedFilters = FILTERS_BY_TYPE[type];
  let dateRangeAdded = false;
  const filters = [
    { equals: { path: "entityType", value: ENTITY_TYPES[type] } },
  ];

  for (const filter of supportedFilters) {
    if (query[filter] === undefined) continue;

    if (filter === "skills") {
      filters.push({
        in: {
          path: "metadata.skills",
          value: query.skills,
        },
      });
    } else if (filter === "dateFrom" || filter === "dateTo") {
      if (dateRangeAdded) continue;
      dateRangeAdded = true;
      filters.push({
        range: {
          path: "metadata.createdAt",
          ...(query.dateFrom ? { gte: query.dateFrom } : {}),
          ...(query.dateTo ? { lte: query.dateTo } : {}),
        },
      });
    } else if (filter === "author") {
      filters.push({
        equals: {
          path: "metadata.authorId",
          value: new mongoose.Types.ObjectId(query.author),
        },
      });
    } else {
      filters.push({
        equals: {
          path: `metadata.${filter}`,
          value: query[filter],
        },
      });
    }
  }

  return { compound: { filter: filters } };
};

const getSearchBranches = (query) => {
  const providedFilters = Object.values(FILTERS_BY_TYPE)
    .flat()
    .filter((filter, index, filters) =>
      query[filter] !== undefined && filters.indexOf(filter) === index
    );
  const selectedTypes =
    query.type === "all" ? Object.keys(ENTITY_TYPES) : query.type.split(",");
  return selectedTypes
    .filter((type) =>
      providedFilters.every((filter) => FILTERS_BY_TYPE[type].includes(filter))
    );
};

const buildKeywordSearchQuery = (query, types) => ({
  index: SEARCH_INDEX,
  compound: {
    must: [
      {
        text: {
          path: "searchableText",
          query: query.q,
        },
      },
    ],
    filter: [
      {
        equals: {
          path: "isActive",
          value: true,
        },
      },
    ],
    should: types.map((type) => buildAtlasTypeFilter(type, query)),
    minimumShouldMatch: 1,
  },
});

const buildVectorTypeFilter = (type, query) => {
  const filters = [{ entityType: ENTITY_TYPES[type] }];

  for (const filter of FILTERS_BY_TYPE[type]) {
    if (query[filter] === undefined) continue;

    if (filter === "skills") {
      filters.push({ "metadata.skills": { $in: query.skills } });
    } else if (filter === "dateFrom" || filter === "dateTo") {
      if (filters.some((item) => item["metadata.createdAt"])) continue;
      filters.push({
        "metadata.createdAt": {
          ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
          ...(query.dateTo ? { $lte: query.dateTo } : {}),
        },
      });
    } else if (filter === "author") {
      filters.push({
        "metadata.authorId": new mongoose.Types.ObjectId(query.author),
      });
    } else {
      filters.push({ [`metadata.${filter}`]: query[filter] });
    }
  }

  return { $and: filters };
};

const buildVectorSearchFilter = (query, types) => {
  const embeddingConfig = getSearchEmbeddingConfig();
  const typeFilters = types.map((type) => buildVectorTypeFilter(type, query));
  const filters = [
    { isActive: true },
    { embeddingModel: embeddingConfig.model },
    { embeddingVersion: embeddingConfig.version },
    typeFilters.length === 1 ? typeFilters[0] : { $or: typeFilters },
  ];

  return { $and: filters };
};

const getEntityIds = (candidates, type) =>
  candidates
    .filter((candidate) => candidate.entityType === type)
    .map(({ entityId }) => entityId);

const createKey = (type, id) => `${type}:${String(id)}`;

const hydratePeople = async (ids) => {
  if (!ids.length) return new Map();

  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: ids }, accountStatus: "active" })
      .select("firstName lastName username avatar role")
      .lean(),
    Profile.find({ user: { $in: ids }, visibility: { $ne: "private" } })
      .select("user headline bio location skills visibility")
      .lean(),
  ]);

  const userById = new Map(users.map((user) => [String(user._id), user]));
  const profileByUserId = new Map(
    profiles.map((profile) => [String(profile.user), profile])
  );
  const results = new Map();

  for (const id of ids) {
    const user = userById.get(String(id));
    const profile = profileByUserId.get(String(id));
    if (!user || !profile) continue;

    const title = [user.firstName, user.lastName].filter(Boolean).join(" ");
    const description = profile.headline || profile.bio || "";

    results.set(createKey("person", id), {
      entityType: "person",
      entityId: String(id),
      title,
      description,
      data: {
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        headline: profile.headline || "",
        location: profile.location || "",
        skills: profile.skills || [],
        visibility: profile.visibility,
      },
    });
  }

  return results;
};

const hydrateJobs = async (ids) => {
  if (!ids.length) return new Map();

  const jobs = await Job.find({
    _id: { $in: ids },
    status: "open",
    moderationStatus: "approved",
  })
    .select(
      "title description requiredSkills experienceLevel jobType location isRemote salaryRange postedBy postedByUser postedByCompany createdAt"
    )
    .lean();

  const companyIds = jobs
    .map(({ postedByCompany }) => postedByCompany)
    .filter(Boolean);
  const posterIds = jobs
    .filter(({ postedByCompany }) => !postedByCompany)
    .map((job) => job.postedByUser || job.postedBy)
    .filter(Boolean);

  const [companies, activePosters] = await Promise.all([
    companyIds.length
      ? Company.find({ _id: { $in: companyIds }, isSuspended: false })
          .select("name logo industry location isVerified")
          .lean()
      : [],
    posterIds.length
      ? User.find({ _id: { $in: posterIds }, accountStatus: "active" })
          .select("_id firstName lastName username avatar")
          .lean()
      : [],
  ]);

  const companyById = new Map(
    companies.map((company) => [String(company._id), company])
  );
  const posterById = new Map(
    activePosters.map((poster) => [String(poster._id), poster])
  );
  const results = new Map();

  for (const job of jobs) {
    const company = job.postedByCompany
      ? companyById.get(String(job.postedByCompany))
      : null;
    const posterId = job.postedByUser || job.postedBy;
    const poster = posterId ? posterById.get(String(posterId)) : null;

    if (job.postedByCompany && !company) continue;
    if (!job.postedByCompany && !poster) continue;

    results.set(createKey("job", job._id), {
      entityType: "job",
      entityId: String(job._id),
      title: job.title,
      description: job.description,
      data: {
        requiredSkills: job.requiredSkills,
        experienceLevel: job.experienceLevel,
        employmentType: job.jobType,
        location: job.location,
        isRemote: job.isRemote,
        salaryRange: job.salaryRange,
        company,
        postedBy: poster
          ? {
              firstName: poster.firstName,
              lastName: poster.lastName,
              username: poster.username,
              avatar: poster.avatar,
            }
          : null,
        createdAt: job.createdAt,
      },
    });
  }

  return results;
};

const hydratePosts = async (ids) => {
  if (!ids.length) return new Map();

  const posts = await Post.find({
    _id: { $in: ids },
    visibility: "public",
  })
    .select("content mediaUrls author visibility createdAt")
    .populate("author", "firstName lastName username avatar role accountStatus")
    .lean();
  const results = new Map();

  for (const post of posts) {
    if (!post.author || post.author.accountStatus !== "active") continue;

    const authorName = [post.author.firstName, post.author.lastName]
      .filter(Boolean)
      .join(" ");

    results.set(createKey("post", post._id), {
      entityType: "post",
      entityId: String(post._id),
      title: authorName || post.author.username,
      description: post.content,
      data: {
        content: post.content,
        mediaUrls: post.mediaUrls,
        visibility: post.visibility,
        createdAt: post.createdAt,
        author: {
          username: post.author.username,
          avatar: post.author.avatar,
          role: post.author.role,
        },
      },
    });
  }

  return results;
};

const hydrateCompanies = async (ids, requester) => {
  if (!ids.length) return new Map();

  const visibilityFilter =
    requester.role === "admin" ? {} : { isSuspended: false };
  const companies = await Company.find({
    _id: { $in: ids },
    ...visibilityFilter,
  })
    .select("name logo description industry location isVerified isSuspended")
    .lean();

  return new Map(
    companies.map((company) => [
      createKey("company", company._id),
      {
        entityType: "company",
        entityId: String(company._id),
        title: company.name,
        description: company.description || "",
        data: {
          logo: company.logo,
          industry: company.industry,
          location: company.location,
          isVerified: company.isVerified,
          ...(requester.role === "admin"
            ? { isSuspended: company.isSuspended }
            : {}),
        },
      },
    ])
  );
};

const hydrateCandidates = async (candidates, requester) => {
  const [people, jobs, posts, companies] = await Promise.all([
    hydratePeople(getEntityIds(candidates, "person")),
    hydrateJobs(getEntityIds(candidates, "job")),
    hydratePosts(getEntityIds(candidates, "post")),
    hydrateCompanies(getEntityIds(candidates, "company"), requester),
  ]);
  const entityMaps = { person: people, job: jobs, post: posts, company: companies };

  return candidates
    .map((candidate) => {
      const result = entityMaps[candidate.entityType]?.get(
        createKey(candidate.entityType, candidate.entityId)
      );

      return result
        ? { ...result, score: candidate.score }
        : null;
    })
    .filter(Boolean);
};

const getCandidateLimit = (query) => {
  const skip = (query.page - 1) * query.limit;
  const configuredPool = Number(process.env.SEARCH_CANDIDATE_POOL || 100);
  const candidatePool =
    Number.isFinite(configuredPool) && configuredPool > 0
      ? Math.max(20, configuredPool)
      : 100;

  return Math.min(
    MAX_CANDIDATES,
    Math.max((skip + query.limit) * 3, candidatePool)
  );
};

const runKeywordSearch = async (query, types, candidateLimit) => {
  const search = buildKeywordSearchQuery(query, types);
  const [candidates, countResult] = await Promise.all([
    SearchDocument.aggregate([
      { $search: search },
      { $limit: candidateLimit },
      {
        $project: {
          entityId: 1,
          entityType: 1,
          score: { $meta: "searchScore" },
        },
      },
    ]),
    SearchDocument.aggregate([
      {
        $searchMeta: {
          ...search,
          count: { type: "total" },
        },
      },
    ]),
  ]);

  return {
    candidates,
    total: countResult[0]?.count?.total || 0,
  };
};

const runVectorSearch = async (query, types, embedding, candidateLimit) => {
  const numCandidates = Math.min(
    MAX_CANDIDATES,
    Math.max(candidateLimit * 10, 100)
  );
  const candidates = await SearchDocument.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX,
        path: "embedding",
        queryVector: embedding,
        numCandidates,
        limit: candidateLimit,
        filter: buildVectorSearchFilter(query, types),
      },
    },
    {
      $project: {
        entityId: 1,
        entityType: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return candidates;
};

const createEmptyResult = (query, mode) => ({
  query: query.q,
  mode,
  fallbackUsed: false,
  results: [],
  pagination: {
    page: query.page,
    limit: query.limit,
    total: 0,
    totalPages: 0,
  },
});

const createSearchResult = async (
  requester,
  query,
  candidates,
  total,
  mode,
  fallbackUsed = false
) => {
  const skip = (query.page - 1) * query.limit;
  const hydrated = await hydrateCandidates(candidates, requester);

  return {
    query: query.q,
    mode,
    fallbackUsed,
    ...(fallbackUsed ? { requestedMode: query.mode } : {}),
    results: hydrated.slice(skip, skip + query.limit),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

const fallbackToKeyword = async (
  requester,
  query,
  types,
  candidateLimit,
  error,
  keywordResult
) => {
  console.error(
    `Search ${query.mode} mode failed; returning keyword results.`,
    error
  );
  const keyword =
    keywordResult || (await runKeywordSearch(query, types, candidateLimit));

  return createSearchResult(
    requester,
    query,
    keyword.candidates,
    keyword.total,
    "keyword",
    true
  );
};

export const search = async (requester, query) => {
  if (requester.accountStatus !== "active") {
    throw new ApiError(403, "Your account is not active.");
  }

  const types = getSearchBranches(query);
  if (!types.length) return createEmptyResult(query, query.mode);

  const candidateLimit = getCandidateLimit(query);
  if (query.mode === "keyword") {
    const keyword = await runKeywordSearch(query, types, candidateLimit);
    return createSearchResult(
      requester,
      query,
      keyword.candidates,
      keyword.total,
      "keyword"
    );
  }

  let embedding;
  try {
    const result = await createEmbeddings([query.q]);
    embedding = result.embeddings[0];
  } catch (error) {
    return fallbackToKeyword(
      requester,
      query,
      types,
      candidateLimit,
      error.message
    );
  }

  if (query.mode === "semantic") {
    try {
      const candidates = await runVectorSearch(
        query,
        types,
        embedding,
        candidateLimit
      );
      return createSearchResult(
        requester,
        query,
        candidates,
        candidates.length,
        "semantic"
      );
    } catch (error) {
      return fallbackToKeyword(
        requester,
        query,
        types,
        candidateLimit,
        error.message
      );
    }
  }

  const keyword = await runKeywordSearch(query, types, candidateLimit);
  try {
    const semantic = await runVectorSearch(
      query,
      types,
      embedding,
      candidateLimit
    );
    const rankedCandidates = reciprocalRankFusion(
      [keyword.candidates, semantic],
      RRF_CONSTANT
    );

    return createSearchResult(
      requester,
      query,
      rankedCandidates,
      rankedCandidates.length,
      "hybrid"
    );
  } catch (error) {
    return fallbackToKeyword(
      requester,
      query,
      types,
      candidateLimit,
      error.message,
      keyword
    );
  }
};
