import type { ApiResponse } from "./auth.types";

export type PostVisibility = "public" | "connections";

export interface PostAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string | null;
  role: "student" | "professional" | "recruiter" | "admin";
}

export interface FeedPost {
  _id: string;
  author: PostAuthor;
  content: string;
  mediaUrls: string[];
  visibility: PostVisibility;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isEdited: boolean;
  originalPost: FeedPost | string | null;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  isSaved: boolean;
}

export interface PostPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FeedPage {
  posts: FeedPost[];
  pagination: PostPagination;
}

export type FeedResponse = ApiResponse<FeedPage>;
export type PostResponse = ApiResponse<FeedPost>;
export type DeletePostResponse = ApiResponse<null>;

export interface UpdatePostPayload {
  postId: string;
  formData: FormData;
}
