import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  ConnectionActionResponse,
  ConnectionPageResponse,
  FollowActionResponse,
  FollowPageResponse,
  RelationshipStatusResponse,
  SuggestionsPageResponse,
} from "@/types/network.types";

interface ListParams {
  page: number;
  limit: number;
}

interface FollowListParams extends ListParams {
  userId: string;
}

export const networkApi = createApi({
  reducerPath: "networkApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ConnectionList", "FollowList", "RelationshipStatus"],

  endpoints: (builder) => ({
    getMyConnections: builder.query<ConnectionPageResponse, ListParams>({
      query: ({ page, limit }) => ({
        url: "/connections/me",
        params: { page, limit },
      }),
      providesTags: ["ConnectionList"],
    }),
    getPendingRequests: builder.query<ConnectionPageResponse, ListParams>({
      query: ({ page, limit }) => ({
        url: "/connections/pending",
        params: { page, limit },
      }),
      providesTags: ["ConnectionList"],
    }),
    getSentRequests: builder.query<ConnectionPageResponse, ListParams>({
      query: ({ page, limit }) => ({
        url: "/connections/sent",
        params: { page, limit },
      }),
      providesTags: ["ConnectionList"],
    }),
    getSuggestions: builder.query<SuggestionsPageResponse, ListParams>({
      query: ({ page, limit }) => ({
        url: "/connections/suggestions",
        params: { page, limit },
      }),
      providesTags: ["ConnectionList"],
    }),
    getRelationshipStatus: builder.query<RelationshipStatusResponse, string>({
      query: (userId) => `/connections/status/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "RelationshipStatus", id: userId },
      ],
    }),
    getFollowers: builder.query<FollowPageResponse, FollowListParams>({
      query: ({ userId, page, limit }) => ({
        url: `/follow/followers/${userId}`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: "FollowList", id: userId },
      ],
    }),
    getFollowing: builder.query<FollowPageResponse, FollowListParams>({
      query: ({ userId, page, limit }) => ({
        url: `/follow/following/${userId}`,
        params: { page, limit },
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: "FollowList", id: userId },
      ],
    }),
    followUser: builder.mutation<FollowActionResponse, string>({
      query: (userId) => ({
        url: `/follow/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["FollowList", "RelationshipStatus"],
    }),
    unfollowUser: builder.mutation<FollowActionResponse, string>({
      query: (userId) => ({
        url: `/follow/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["FollowList", "RelationshipStatus"],
    }),
    sendConnectionRequest: builder.mutation<ConnectionActionResponse, string>({
      query: (recipientId) => ({
        url: "/connections",
        method: "POST",
        body: { recipientId },
      }),
      invalidatesTags: ["ConnectionList", "RelationshipStatus"],
    }),
    acceptConnectionRequest: builder.mutation<
      ConnectionActionResponse,
      string
    >({
      query: (connectionId) => ({
        url: `/connections/${connectionId}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: ["ConnectionList", "RelationshipStatus"],
    }),
    rejectConnectionRequest: builder.mutation<
      ConnectionActionResponse,
      string
    >({
      query: (connectionId) => ({
        url: `/connections/${connectionId}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: ["ConnectionList", "RelationshipStatus"],
    }),
    cancelConnectionRequest: builder.mutation<
      ConnectionActionResponse,
      string>({
      query: (connectionId) => ({
        url: `/connections/${connectionId}/cancel`,
        method: "DELETE",
      }),
      invalidatesTags: ["ConnectionList", "RelationshipStatus"],
    }),
    removeConnection: builder.mutation<ConnectionActionResponse, string>({
      query: (connectionId) => ({
        url: `/connections/${connectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ConnectionList", "RelationshipStatus"],
    }),
  }),
});

export const {
  useGetMyConnectionsQuery,
  useGetPendingRequestsQuery,
  useGetSentRequestsQuery,
  useGetSuggestionsQuery,
  useGetRelationshipStatusQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useSendConnectionRequestMutation,
  useAcceptConnectionRequestMutation,
  useRejectConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useRemoveConnectionMutation,
} = networkApi;
