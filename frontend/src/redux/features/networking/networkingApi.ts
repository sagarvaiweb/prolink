import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/features/auth/authApi";
import type { RootState } from "@/redux/store";
import type { ApiResponse } from "@/types/auth.types";
import type {
  Connection,
  ConnectionListData,
  ConnectionRequestActionPayload,
  ConnectionStatusData,
  Follow,
  FollowCountData,
  FollowListData,
  FollowStatusData,
  PaginationParams,
  PendingRequestCountData,
  ReceivedConnectionRequestsData,
  SendConnectionRequestPayload,
  SentConnectionRequestsData,
} from "@/types/networking.types";

export const networkingApi = createApi({
  reducerPath: "networkingApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Connection",
    "ConnectionRequests",
    "ConnectionStatus",
    "Follow",
    "FollowStatus",
    "FollowList",
    "FollowCount",
    "MutualConnections",
    "ConnectionSuggestions",
  ],
  endpoints: (builder) => ({
    sendConnectionRequest: builder.mutation<
      ApiResponse<Connection>,
      SendConnectionRequestPayload
    >({
      query: (body) => ({
        url: "/networking/connections/request",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { recipient }) => [
        { type: "ConnectionRequests", id: "SENT" },
        { type: "ConnectionStatus", id: recipient },
        { type: "ConnectionSuggestions", id: "LIST" },
      ],
    }),
    acceptConnectionRequest: builder.mutation<
      ApiResponse<Connection>,
      ConnectionRequestActionPayload
    >({
      query: (body) => ({
        url: "/networking/connections/accept",
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => [
        { type: "Connection", id: "LIST" },
        { type: "ConnectionRequests", id: "RECEIVED" },
        { type: "ConnectionRequests", id: "COUNT" },
        { type: "ConnectionStatus", id: result?.data.requester },
        { type: "MutualConnections", id: "LIST" },
        { type: "ConnectionSuggestions", id: "LIST" },
      ],
    }),
    rejectConnectionRequest: builder.mutation<
      ApiResponse<Connection>,
      ConnectionRequestActionPayload
    >({
      query: (body) => ({
        url: "/networking/connections/reject",
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => [
        { type: "ConnectionRequests", id: "RECEIVED" },
        { type: "ConnectionRequests", id: "COUNT" },
        { type: "ConnectionStatus", id: result?.data.requester },
        { type: "ConnectionSuggestions", id: "LIST" },
      ],
    }),
    cancelConnectionRequest: builder.mutation<
      ApiResponse<Connection>,
      ConnectionRequestActionPayload
    >({
      query: (body) => ({
        url: "/networking/connections/cancel",
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result) => [
        { type: "ConnectionRequests", id: "SENT" },
        { type: "ConnectionStatus", id: result?.data.recipient },
        { type: "ConnectionSuggestions", id: "LIST" },
      ],
    }),
    removeConnection: builder.mutation<ApiResponse<{ _id: string }>, string>({
      query: (connectionId) => ({
        url: `/networking/connections/${connectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Connection", id: "LIST" },
        { type: "ConnectionStatus", id: "LIST" },
        { type: "MutualConnections", id: "LIST" },
        { type: "ConnectionSuggestions", id: "LIST" },
      ],
    }),
    getConnections: builder.query<ApiResponse<ConnectionListData>, PaginationParams | void>({
      query: (params) => ({ url: "/networking/connections", params: params ?? undefined }),
      providesTags: [{ type: "Connection", id: "LIST" }],
    }),
    getReceivedConnectionRequests: builder.query<
      ApiResponse<ReceivedConnectionRequestsData>,
      PaginationParams | void
    >({
      query: (params) => ({
        url: "/networking/connections/requests/received",
        params: params ?? undefined,
      }),
      providesTags: [{ type: "ConnectionRequests", id: "RECEIVED" }],
    }),
    getSentConnectionRequests: builder.query<
      ApiResponse<SentConnectionRequestsData>,
      PaginationParams | void
    >({
      query: (params) => ({
        url: "/networking/connections/requests/sent",
        params: params ?? undefined,
      }),
      providesTags: [{ type: "ConnectionRequests", id: "SENT" }],
    }),
    getPendingRequestCount: builder.query<ApiResponse<PendingRequestCountData>, void>({
      query: () => "/networking/connections/requests/count",
      providesTags: [{ type: "ConnectionRequests", id: "COUNT" }],
    }),
    getConnectionStatus: builder.query<ApiResponse<ConnectionStatusData>, string>({
      query: (userId) => `/networking/connections/status/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "ConnectionStatus", id: userId },
        { type: "ConnectionStatus", id: "LIST" },
      ],
    }),
    followUser: builder.mutation<ApiResponse<Follow>, string>({
      query: (userId) => ({
        url: `/networking/follow/${userId}`,
        method: "POST",
      }),
      invalidatesTags: (result, _error, userId) => [
        { type: "FollowList", id: "FOLLOWING" },
        { type: "FollowStatus", id: userId },
        { type: "FollowCount", id: userId },
        ...(result?.data.follower
          ? [{ type: "FollowCount" as const, id: result.data.follower }]
          : []),
      ],
    }),
    unfollowUser: builder.mutation<ApiResponse<{ _id: string }>, string>({
      query: (userId) => ({
        url: `/networking/follow/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, userId) => [
        { type: "FollowList", id: "FOLLOWING" },
        { type: "FollowStatus", id: userId },
        { type: "FollowCount", id: userId },
      ],
      async onQueryStarted(_userId, { dispatch, getState, queryFulfilled }) {
        try {
          await queryFulfilled;
          const currentUserId = (getState() as RootState).auth.user?._id;

          if (currentUserId) {
            dispatch(
              networkingApi.util.invalidateTags([
                { type: "FollowCount", id: currentUserId },
              ])
            );
          }
        } catch {
          // The mutation error remains available through RTK Query.
        }
      },
    }),
    getFollowers: builder.query<ApiResponse<FollowListData>, PaginationParams | void>({
      query: (params) => ({ url: "/networking/followers", params: params ?? undefined }),
      providesTags: [{ type: "FollowList", id: "FOLLOWERS" }],
    }),
    getFollowing: builder.query<ApiResponse<FollowListData>, PaginationParams | void>({
      query: (params) => ({ url: "/networking/following", params: params ?? undefined }),
      providesTags: [{ type: "FollowList", id: "FOLLOWING" }],
    }),
    getFollowStatus: builder.query<ApiResponse<FollowStatusData>, string>({
      query: (userId) => `/networking/follow/status/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "FollowStatus", id: userId },
      ],
    }),
    getFollowCount: builder.query<ApiResponse<FollowCountData>, string>({
      query: (userId) => `/networking/follow/count/${userId}`,
      providesTags: (_result, _error, userId) => [
        { type: "FollowCount", id: userId },
      ],
    }),
    getMutualConnections: builder.query<
      ApiResponse<FollowListData>,
      { userId: string; params?: PaginationParams }
    >({
      query: ({ userId, params }) => ({
        url: `/networking/connections/mutual/${userId}`,
        params,
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: "MutualConnections", id: userId },
        { type: "MutualConnections", id: "LIST" },
      ],
    }),
    getConnectionSuggestions: builder.query<
      ApiResponse<FollowListData>,
      PaginationParams | void
    >({
      query: (params) => ({
        url: "/networking/connections/suggestions",
        params: params ?? undefined,
      }),
      providesTags: [{ type: "ConnectionSuggestions", id: "LIST" }],
    }),
  }),
});

export const {
  useSendConnectionRequestMutation,
  useAcceptConnectionRequestMutation,
  useRejectConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useRemoveConnectionMutation,
  useGetConnectionsQuery,
  useGetReceivedConnectionRequestsQuery,
  useGetSentConnectionRequestsQuery,
  useGetPendingRequestCountQuery,
  useGetConnectionStatusQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowStatusQuery,
  useGetFollowCountQuery,
  useGetMutualConnectionsQuery,
  useGetConnectionSuggestionsQuery,
} = networkingApi;
