import type { ApiResponse, User } from "./auth.types";
import type { Job, JobPagination } from "./job.types";

export type CompanyRole = "owner" | "admin" | "recruiter";
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";

export interface Company {
  _id: string;
  name: string;
  logo: string | null;
  description: string;
  industry: string;
  companySize: CompanySize | null;
  website: string | null;
  location: string;
  createdBy: Pick<User, "_id" | "firstName" | "lastName" | "username" | "avatar"> | string;
  isVerified: boolean;
  isSuspended: boolean;
  followerCount: number;
  createdAt: string;
  updatedAt: string;
  isFollowing?: boolean;
}

export interface CompanyPayload {
  name: string;
  logo?: string | null;
  description?: string;
  industry?: string;
  companySize?: CompanySize;
  website?: string | null;
  location?: string;
}

export interface CompanyListParams {
  page: number;
  limit: number;
  search?: string;
  industry?: string;
  companySize?: CompanySize;
}

export interface CompanyPagination extends JobPagination {}
export interface CompanyListData {
  companies: Company[];
  pagination: CompanyPagination;
}
export interface CompanyProfileData {
  company: Company;
  viewerRole: CompanyRole | null;
  isFollowing: boolean;
}
export interface CompanyJobsData {
  company: Company;
  jobs: Job[];
  pagination: CompanyPagination;
}

export type CompanyListResponse = ApiResponse<CompanyListData>;
export type CompanyProfileResponse = ApiResponse<CompanyProfileData>;
export type CompanyJobsResponse = ApiResponse<CompanyJobsData>;
export type CompanyMutationResponse = ApiResponse<{ company: Company; viewerRole: CompanyRole }>;
