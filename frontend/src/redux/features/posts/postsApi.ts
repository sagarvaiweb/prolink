import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  DeletePostResponse,
  FeedResponse,
  PostResponse,
} from "@/types/post.types";

interface FeedParams {
  page: number;
  limit: number;
}

interface UpdatePostPayload {
  postId: string;
  formData: FormData;
}

export const postsApi = createApi({
  reducerPath: "postsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Feed", "Post"],
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
  }),
});

export const {
  useGetFeedQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
} = postsApi;
