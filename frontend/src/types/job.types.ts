import type { ApiResponse } from "./auth.types";

export type ExperienceLevel = "entry" | "mid" | "senior";
export type JobType = "full-time" | "part-time" | "internship" | "contract";
export type JobStatus = "open" | "closed";
export type JobModerationStatus = "pending" | "approved" | "rejected";

export interface JobRecruiter {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
}

export interface JobCompany {
  _id: string;
  name: string;
  logo?: string | null;
  industry?: string;
  website?: string | null;
  isVerified?: boolean;
  isSuspended?: boolean;
}

export interface Job {
  _id: string;
  postedBy: JobRecruiter | null;
  company?: JobCompany | null;
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  location: string;
  isRemote: boolean;
  salaryRange: string | null;
  status: JobStatus;
  moderationStatus: JobModerationStatus;
  moderationNote?: string | null;
  applicantCount: number;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
}

export interface JobPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobPage {
  jobs: Job[];
  pagination: JobPagination;
}

export interface JobListParams {
  page: number;
  limit: number;
  search?: string;
  location?: string;
  experienceLevel?: ExperienceLevel;
  jobType?: JobType;
  isRemote?: boolean;
  skills?: string;
  status?: JobStatus;
}

export interface JobPayload {
  title: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  jobType: JobType;
  location: string;
  isRemote: boolean;
  salaryRange: string | null;
}

export interface CreateJobPayload extends JobPayload {
  companyId: string;
}

export interface UpdateJobPayload {
  jobId: string;
  data: Partial<JobPayload>;
}

export interface ReviewJobPayload {
  jobId: string;
  decision: "approve" | "reject";
  note?: string;
}

export type JobPageResponse = ApiResponse<JobPage>;
export type JobResponse = ApiResponse<Job>;
export type JobMutationResponse = ApiResponse<Job>;
export type JobActionResponse = ApiResponse<null>;
