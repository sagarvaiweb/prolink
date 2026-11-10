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
  savedAt?: string;
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

export interface PostLikeState {
  likeCount: number;
  isLiked: boolean;
}

export interface PostComment {
  _id: string;
  post: string;
  author: PostAuthor;
  content: string;
  parentComment: string | null;
  isEdited: boolean;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPage {
  comments: PostComment[];
  pagination: PostPagination;
}

export interface ReplyPage {
  replies: PostComment[];
  pagination: PostPagination;
}

export interface AddCommentPayload {
  postId: string;
  content: string;
  parentComment?: string;
}

export interface UpdateCommentPayload {
  commentId: string;
  content: string;
}

export interface SharePostPayload {
  postId: string;
  content: string;
  visibility: PostVisibility;
}

export interface SavePostState {
  postId: string;
  isSaved: boolean;
}

export type PostReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "inappropriate"
  | "other";

export type PostReportStatus = "pending" | "dismissed" | "actioned" | "post_removed";

export interface ReportPostPayload {
  postId: string;
  reason: PostReportReason;
  details: string;
}

export interface PostReport {
  _id: string;
  post: FeedPost | string | null;
  reporter: PostAuthor | string;
  reason: PostReportReason;
  details: string;
  status: PostReportStatus;
  reviewedBy?: PostAuthor | string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostReportPage {
  reports: PostReport[];
  pagination: PostPagination;
}

export interface ReviewPostReportPayload {
  reportId: string;
  status: Exclude<PostReportStatus, "pending">;
}
