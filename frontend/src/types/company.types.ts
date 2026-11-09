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
  ownerCount: number;
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
  isVerified?: boolean;
}

export interface CompanyStatusChangeData {
  company: Company;
  closedJobCount?: number;
}

export type CompanyPagination = JobPagination;
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

export interface CompanyMember {
  _id: string;
  company: string;
  user: Pick<User, "_id" | "firstName" | "lastName" | "username" | "avatar" | "role">;
  role: CompanyRole;
  addedAt: string;
}

export interface CompanyMembersData {
  members: CompanyMember[];
  pagination: CompanyPagination;
}

export interface RecruiterCandidate {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

export interface RecruiterCandidatesData {
  recruiters: RecruiterCandidate[];
  pagination: CompanyPagination;
}

export type CompanyListResponse = ApiResponse<CompanyListData>;
export type CompanyProfileResponse = ApiResponse<CompanyProfileData>;
export type CompanyJobsResponse = ApiResponse<CompanyJobsData>;
export type CompanyMutationResponse = ApiResponse<{ company: Company; viewerRole: CompanyRole }>;
export type CompanyMembersResponse = ApiResponse<CompanyMembersData>;
export type RecruiterCandidatesResponse = ApiResponse<RecruiterCandidatesData>;
export type CompanyMemberResponse = ApiResponse<CompanyMember>;
export type CompanyActionResponse = ApiResponse<null>;
export type CompanyStatusChangeResponse = ApiResponse<CompanyStatusChangeData>;
export type CompanyVerificationResponse = ApiResponse<Company>;
