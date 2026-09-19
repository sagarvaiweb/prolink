export interface Experience {
  _id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface Education {
  _id: string;
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
}

export interface Profile {
  _id: string;
  user: string;
  headline?: string;
  bio?: string;
  location?: string;
  coverPhoto?: string;
  resumeUrl?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  visibility: "public" | "connections" | "private";
  profileCompletion: number;
  viewCount: number;
}

export interface UpdateProfilePayload {
  headline?: string;
  bio?: string;
  location?: string;
  visibility?: "public" | "connections" | "private";
}

export interface ExperiencePayload {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface EducationPayload {
  school: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateSkillsPayload {
  skills: string[];
}