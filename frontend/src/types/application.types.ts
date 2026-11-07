import type { ApiResponse } from "./auth.types";
import type { JobPagination } from "./job.types";

export type ApplicationStatus = "applied" | "shortlisted" | "rejected" | "hired";

export interface ApplicationJob {
  _id: string;
  title: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  status: "open" | "closed";
  postedBy?: { firstName: string; lastName: string; username: string };
}

export interface ApplicantUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  role: string;
}

export interface Application {
  _id: string;
  job: ApplicationJob;
  applicant?: ApplicantUser;
  resumeUrl: string;
  matchScore?: number;
  missingSkills: string[];
  status: ApplicationStatus;
  statusUpdatedAt?: string;
  createdAt: string;
}

export interface ApplicationPage {
  applications: Application[];
  pagination: JobPagination;
}

export type ApplicationPageResponse = ApiResponse<ApplicationPage>;
export type ApplicationResponse = ApiResponse<Application>;
export type ApplicationActionResponse = ApiResponse<null>;
