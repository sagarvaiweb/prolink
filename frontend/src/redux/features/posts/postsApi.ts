import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type { ApiResponse } from "@/types/auth.types";
import type {
  AddCommentPayload,
  CommentPage,
  DeletePostResponse,
  FeedResponse,
  PostComment,
  PostLikeState,
  PostResponse,
  ReplyPage,
  UpdateCommentPayload,
  UpdatePostPayload,
} from "@/types/post.types";

interface FeedParams {
  page: number;
  limit: number;
}

export const postsApi = createApi({
  reducerPath: "postsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Feed", "Post", "Comments"],
  endpoints: (builder) => ({
    getFeed: builder.query<FeedResponse, FeedParams>({
      query: ({ page, limit }) => ({
        url: "/posts/feed",
        params: { page, limit },
      }),
      providesTags: (result) => [
        { type: "Feed", id: "LIST" },
        ...(result?.data.posts.map((post) => ({
          type: "Post" as const,
          id: post._id,
        })) ?? []),
      ],
    }),
    getPostById: builder.query<PostResponse, string>({
      query: (postId) => `/posts/${postId}`,
      providesTags: (_result, _error, postId) => [
        { type: "Post", id: postId },
      ],
    }),
    getPostsByUser: builder.query<
      FeedResponse,
      FeedParams & { userId: string }
    >({
      query: ({ userId, page, limit }) => ({
        url: `/posts/user/${userId}`,
        params: { page, limit },
      }),
      providesTags: (result) => [
        { type: "Feed", id: "LIST" },
        ...(result?.data.posts.map((post) => ({
          type: "Post" as const,
          id: post._id,
        })) ?? []),
      ],
    }),
    getPostComments: builder.query<
      ApiResponse<CommentPage>,
      { postId: string; page: number; limit: number }
    >({
      query: ({ postId, page, limit }) => ({
        url: `/posts/${postId}/comments`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, { postId }) => [
        { type: "Comments", id: postId },
      ],
    }),
    getCommentReplies: builder.query<
      ApiResponse<ReplyPage>,
      { postId: string; commentId: string; page: number; limit: number }
    >({
      query: ({ postId, commentId, page, limit }) => ({
        url: `/posts/${postId}/comments/${commentId}/replies`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, { postId, commentId }) => [
        { type: "Comments", id: postId },
        { type: "Comments", id: `REPLIES-${commentId}` },
      ],
    }),
    createPost: builder.mutation<PostResponse, FormData>({
      query: (body) => ({
        url: "/posts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Feed", id: "LIST" }],
    }),
    updatePost: builder.mutation<PostResponse, UpdatePostPayload>({
      query: ({ postId, formData }) => ({
        url: `/posts/${postId}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "LIST" },
      ],
    }),
    deletePost: builder.mutation<DeletePostResponse, string>({
      query: (postId) => ({
        url: `/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "LIST" },
      ],
    }),
    likePost: builder.mutation<
      ApiResponse<PostLikeState>,
      string
    >({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "LIST" },
      ],
    }),
    unlikePost: builder.mutation<
      ApiResponse<PostLikeState>,
      string
    >({
      query: (postId) => ({
        url: `/posts/${postId}/like`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, postId) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "LIST" },
      ],
    }),
    addPostComment: builder.mutation<
      ApiResponse<PostComment>,
      AddCommentPayload
    >({
      query: ({ postId, content, parentComment }) => ({
        url: `/posts/${postId}/comments`,
        method: "POST",
        body: { content, ...(parentComment ? { parentComment } : {}) },
      }),
      invalidatesTags: (_result, _error, { postId, parentComment }) => [
        { type: "Comments", id: postId },
        ...(parentComment
          ? [{ type: "Comments" as const, id: `REPLIES-${parentComment}` }]
          : []),
        { type: "Post", id: postId },
        { type: "Feed", id: "LIST" },
      ],
    }),
    updatePostComment: builder.mutation<
      ApiResponse<PostComment>,
      UpdateCommentPayload & { postId: string }
    >({
      query: ({ commentId, content }) => ({
        url: `/posts/comments/${commentId}`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Comments", id: postId },
      ],
    }),
    deletePostComment: builder.mutation<
      ApiResponse<null>,
      { postId: string; commentId: string; parentComment?: string | null }
    >({
      query: ({ commentId }) => ({
        url: `/posts/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { postId, parentComment }) => [
        { type: "Comments", id: postId },
        ...(parentComment
          ? [{ type: "Comments" as const, id: `REPLIES-${parentComment}` }]
          : []),
        { type: "Post", id: postId },
        { type: "Feed", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetFeedQuery,
  useGetPostByIdQuery,
  useGetPostsByUserQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetPostCommentsQuery,
  useGetCommentRepliesQuery,
  useLikePostMutation,
  useUnlikePostMutation,
  useAddPostCommentMutation,
  useUpdatePostCommentMutation,
  useDeletePostCommentMutation,
} = postsApi;
