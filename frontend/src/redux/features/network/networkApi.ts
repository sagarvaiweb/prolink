import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  ConnectionActionResponse,
  ConnectionPageResponse,
} from "@/types/network.types";

interface ListParams {
  page: number;
  limit: number;
}

export const networkApi = createApi({
  reducerPath: "networkApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ConnectionList"],

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
    acceptConnectionRequest: builder.mutation<
      ConnectionActionResponse,
      string
    >({
      query: (connectionId) => ({
        url: `/connections/${connectionId}/accept`,
        method: "PATCH",
      }),
      invalidatesTags: ["ConnectionList"],
    }),
    rejectConnectionRequest: builder.mutation<
      ConnectionActionResponse,
      string
    >({
      query: (connectionId) => ({
        url: `/connections/${connectionId}/reject`,
        method: "PATCH",
      }),
      invalidatesTags: ["ConnectionList"],
    }),
    cancelConnectionRequest: builder.mutation<
      ConnectionActionResponse,
      string>({
      query: (connectionId) => ({
        url: `/connections/${connectionId}/cancel`,
        method: "DELETE",
      }),
      invalidatesTags: ["ConnectionList"],
    }),
    removeConnection: builder.mutation<ConnectionActionResponse, string>({
      query: (connectionId) => ({
        url: `/connections/${connectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ConnectionList"],
    }),
  }),
});

export const {
  useGetMyConnectionsQuery,
  useGetPendingRequestsQuery,
  useGetSentRequestsQuery,
  useAcceptConnectionRequestMutation,
  useRejectConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useRemoveConnectionMutation,
} = networkApi;
