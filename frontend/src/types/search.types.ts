import type { ApiResponse } from "./auth.types";
import type { Job, JobPagination } from "./job.types";

export type SearchType = "all" | "people" | "jobs" | "posts" | "companies";
export type SearchMode = "keyword" | "smart";

export interface SearchParams {
  q: string;
  type: SearchType;
  mode: SearchMode;
  page: number;
  limit: number;
  role?: "student" | "professional" | "recruiter" | "admin";
  location?: string;
  jobType?: Job["jobType"];
  experienceLevel?: Job["experienceLevel"];
  industry?: string;
}

export interface SearchPerson {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  role: string;
  profile: {
    _id: string;
    headline?: string;
    bio?: string;
    location?: string;
    skills: string[];
  } | null;
  _type: "people";
  searchScore: number;
}

export interface SearchJob extends Job {
  _type: "jobs";
  searchScore: number;
}

export interface SearchPost {
  _id: string;
  content: string;
  author: { _id: string; firstName: string; lastName: string; username: string; avatar?: string };
  createdAt: string;
  _type: "posts";
  searchScore: number;
}

export interface SearchCompany {
  _id: string;
  name: string;
  logo?: string | null;
  description?: string;
  industry?: string;
  location?: string;
  isVerified?: boolean;
  _type: "companies";
  searchScore: number;
}

export type SearchResult = SearchPerson | SearchJob | SearchPost | SearchCompany;

export interface SearchPageData {
  results: SearchResult[];
  pagination: JobPagination;
  mode: SearchMode;
}

export type SearchResponse = ApiResponse<SearchPageData>;

export interface RecentSearch {
  _id: string;
  query: string;
  type: SearchType;
  createdAt: string;
}

export type RecentSearchesResponse = ApiResponse<{ searches: RecentSearch[] }>;
export type AutocompleteResponse = ApiResponse<{ suggestions: string[] }>;
