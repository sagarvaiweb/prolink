import type { ApiResponse } from "@/types/auth.types";

export type SearchEntityType = "people" | "jobs" | "posts" | "companies";
export type SearchCategory = "all" | SearchEntityType;
export type SearchMode = "keyword" | "semantic" | "hybrid";

export interface SearchFilters {
  location?: string;
  skills?: string;
  role?: string;
  title?: string;
  experienceLevel?: string;
  employmentType?: string;
  salaryRange?: string;
  industry?: string;
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  visibility?: "public";
}

export interface SearchState {
  query: string;
  activeType: SearchCategory;
  searchMode: SearchMode;
  activeFilters: SearchFilters;
  page: number;
}

export interface SearchRequest extends SearchFilters {
  q: string;
  type: SearchCategory;
  mode: SearchMode;
  page: number;
  limit: number;
}

export interface SearchPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SearchResultBase {
  entityId: string;
  title: string;
  description: string;
  score: number;
}

export interface PersonSearchResult extends SearchResultBase {
  entityType: "person";
  data: {
    username: string;
    avatar?: string;
    role: string;
    headline: string;
    location: string;
    skills: string[];
    visibility: "public" | "connections";
  };
}

export interface JobSearchResult extends SearchResultBase {
  entityType: "job";
  data: {
    requiredSkills: string[];
    experienceLevel: string;
    employmentType: string;
    location: string;
    isRemote: boolean;
    salaryRange: string | null;
    company: {
      name: string;
      logo?: string | null;
      industry?: string;
      location?: string;
      isVerified?: boolean;
    } | null;
    postedBy: {
      firstName: string;
      lastName: string;
      username: string;
      avatar?: string;
    } | null;
    createdAt: string;
  };
}

export interface PostSearchResult extends SearchResultBase {
  entityType: "post";
  data: {
    content: string;
    mediaUrls: string[];
    visibility: string;
    createdAt: string;
    author: {
      username: string;
      avatar?: string;
      role: string;
    };
  };
}

export interface CompanySearchResult extends SearchResultBase {
  entityType: "company";
  data: {
    logo?: string | null;
    industry?: string;
    location?: string;
    isVerified: boolean;
    isSuspended?: boolean;
  };
}

export type SearchResult =
  | PersonSearchResult
  | JobSearchResult
  | PostSearchResult
  | CompanySearchResult;

export interface SearchResultsData {
  query: string;
  mode: SearchMode;
  fallbackUsed: boolean;
  requestedMode?: SearchMode;
  results: SearchResult[];
  pagination: SearchPagination;
}

export type SearchResponse = ApiResponse<SearchResultsData>;
