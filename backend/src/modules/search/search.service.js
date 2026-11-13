import mongoose from "mongoose";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { Job } from "../../models/Job.model.js";
import { Company } from "../../models/Company.model.js";
import { Profile } from "../../models/Profile.model.js";
import { Post } from "../../models/Post.model.js";
import { User } from "../../models/User.model.js";
import { Connection } from "../../models/Connection.model.js";
import { RecentSearch } from "../../models/RecentSearch.model.js";
import ApiError from "../../utils/ApiError.js";
import { embedText, cosineSimilarity } from "./embedding.service.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokens = (value) => [...new Set(value.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) ?? [])];
const textScore = (query, text) => {
  const words = tokens(query);
  const haystack = String(text ?? "").toLowerCase();
  return words.length ? words.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0) / words.length : 0;
};
const ensureActive = (user) => {
  if (user.accountStatus !== "active") throw new ApiError(403, "Your account is not active.");
};
const buildRegex = (q) => new RegExp(escapeRegex(q), "i");

const peopleSearch = async (userId, q, filters) => {
  const term = buildRegex(q);
  const userFilter = { accountStatus: "active", $or: [{ firstName: term }, { lastName: term }, { username: term }] };
  if (filters.role) userFilter.role = filters.role;
  const profiles = await Profile.find({
    $or: [{ headline: term }, { bio: term }, { skills: term }, ...(filters.location ? [{ location: buildRegex(filters.location) }] : [])],
    visibility: { $in: ["public", "connections"] },
  }).select("user headline bio location skills visibility").lean();
  const userIds = new Set(profiles.map((profile) => String(profile.user)));
  const matchingUsers = await User.find(userFilter).select("_id firstName lastName username avatar role accountStatus").lean();
  matchingUsers.forEach(({ _id }) => userIds.add(String(_id)));
  const ids = [...userIds].map((id) => new mongoose.Types.ObjectId(id));
  const ownOrConnected = new Set([String(userId)]);
  const connections = await Connection.find({ status: "accepted", $or: [{ requester: userId }, { recipient: userId }] }).select("requester recipient").lean();
  connections.forEach((connection) => ownOrConnected.add(String(String(connection.requester) === String(userId) ? connection.recipient : connection.requester)));
  const connectedIds = [...ownOrConnected].map((id) => new mongoose.Types.ObjectId(id));
  const visibleProfiles = await Profile.find({
    user: { $in: ids },
    $or: [{ visibility: "public" }, { visibility: "connections", user: { $in: connectedIds } }, { user: userId }],
    ...(filters.location ? { location: buildRegex(filters.location) } : {}),
  }).lean();
  const visibleIds = visibleProfiles.map((profile) => profile.user);
  const users = await User.find({ _id: { $in: visibleIds }, accountStatus: "active", ...(filters.role ? { role: filters.role } : {}) }).select("firstName lastName username avatar role").lean();
  const profileByUser = new Map(visibleProfiles.map((profile) => [String(profile.user), profile]));
  return users.map((person) => ({ ...person, profile: profileByUser.get(String(person._id)) ?? null, _type: "people" }));
};

const searchEntities = async (user, q, type, filters, mode) => {
  const term = buildRegex(q);
  const output = [];
  if (type === "jobs" || type === "all") {
    const jobs = await Job.find({ status: "open", moderationStatus: "approved", $or: [{ title: term }, { description: term }, { requiredSkills: term }, ...(filters.location ? [{ location: buildRegex(filters.location) }] : [])], ...(filters.jobType ? { jobType: filters.jobType } : {}), ...(filters.experienceLevel ? { experienceLevel: filters.experienceLevel } : {}) })
      .populate("postedByCompany", "name logo industry website isVerified isSuspended")
      .populate("postedByUser", "firstName lastName username avatar")
      .populate("postedBy", "firstName lastName username avatar").limit(500).lean();
    const activeCompanies = new Set((await Company.distinct("_id", { isSuspended: false })).map(String));
    for (const job of jobs) {
      if (job.postedByCompany && !activeCompanies.has(String(job.postedByCompany._id))) continue;
      const haystack = [job.title, job.description, ...(job.requiredSkills ?? []), job.location, job.experienceLevel, job.jobType].join(" ");
      output.push({ ...job, postedBy: job.postedByUser ?? job.postedBy ?? null, company: job.postedByCompany ?? null, _type: "jobs", _score: textScore(q, haystack) });
    }
  }
  if (type === "people" || type === "all") output.push(...(await peopleSearch(user._id, q, filters)).map((person) => ({ ...person, _score: textScore(q, [person.firstName, person.lastName, person.username, person.profile?.headline, person.profile?.bio, ...(person.profile?.skills ?? [])].join(" ")) })));
  if (type === "posts" || type === "all") {
    const posts = await Post.find({ content: term, visibility: "public" }).populate("author", "firstName lastName username avatar accountStatus").sort({ createdAt: -1 }).limit(500).lean();
    output.push(...posts.filter((post) => post.author?.accountStatus === "active").map((post) => ({ ...post, _type: "posts", _score: textScore(q, post.content) })));
  }
  if (type === "companies" || type === "all") {
    const companies = await Company.find({ isSuspended: false, ...(filters.industry ? { industry: buildRegex(filters.industry) } : {}), $or: [{ name: term }, { description: term }, { industry: term }] }).sort({ isVerified: -1 }).limit(500).lean();
    output.push(...companies.map((company) => ({ ...company, _type: "companies", _score: textScore(q, [company.name, company.description, company.industry].join(" ")) })));
  }
  if (mode === "smart") {
    let queryEmbedding;
    try { queryEmbedding = await embedText(q); } catch (error) { console.error("Search embedding failed; using keyword ranking:", error.message); }
    if (queryEmbedding) {
      const entityTypes = [...new Set(output.map((item) => ({ jobs: "job", posts: "post", people: "profile", companies: "company" })[item._type]))];
      const documents = await SearchDocument.find({ entityType: { $in: entityTypes }, entityId: { $in: output.map((item) => item._id) }, isSearchable: true }).select("entityType entityId embedding").lean();
      const documentByKey = new Map(documents.map((doc) => [`${doc.entityType}:${doc.entityId}`, doc]));
      for (const item of output) {
        const entityType = { jobs: "job", posts: "post", people: "profile", companies: "company" }[item._type];
        const doc = documentByKey.get(`${entityType}:${item._id}`);
        const semantic = cosineSimilarity(queryEmbedding.vector, doc?.embedding);
        if (semantic !== null) item._score = Math.max(item._score, (semantic + 1) / 2);
      }
    }
  }
  return output.filter((item) => item._score > 0).sort((a, b) => b._score - a._score || new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
};

export const search = async (user, { q, type = "all", mode = "keyword", page = 1, limit = 10, ...filters }) => {
  ensureActive(user);
  const query = q.trim();
  const results = await searchEntities(user, query, type, filters, mode);
  await RecentSearch.create({ user: user._id, query, type });
  const start = (page - 1) * limit;
  return { results: results.slice(start, start + limit).map(({ _score, ...item }) => ({ ...item, searchScore: Number(_score.toFixed(4)) })), pagination: { total: results.length, page, limit, totalPages: Math.ceil(results.length / limit) }, mode };
};

export const autocomplete = async (q) => {
  const prefix = new RegExp(`^${escapeRegex(q.trim())}`, "i");
  const [people, jobs, companies] = await Promise.all([
    User.find({ accountStatus: "active", $or: [{ firstName: prefix }, { lastName: prefix }, { username: prefix }] }).select("firstName lastName username").limit(5).lean(),
    Job.find({ status: "open", moderationStatus: "approved", title: prefix }).select("title").limit(5).lean(),
    Company.find({ isSuspended: false, name: prefix }).select("name").limit(5).lean(),
  ]);
  return [...new Set([...people.map((p) => `${p.firstName} ${p.lastName}`.trim()), ...jobs.map((j) => j.title), ...companies.map((c) => c.name)])].slice(0, 8);
};

export const getRecentSearches = async (userId) => RecentSearch.find({ user: userId }).sort({ createdAt: -1 }).limit(20).lean();
export const deleteRecentSearch = async (userId, id) => {
  const result = await RecentSearch.deleteOne({ _id: id, user: userId });
  if (!result.deletedCount) throw new ApiError(404, "Recent search not found.");
};
export const clearRecentSearches = async (userId) => RecentSearch.deleteMany({ user: userId });
