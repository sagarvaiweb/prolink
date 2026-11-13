import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type { ApiResponse } from "@/types/auth.types";
import type { AutocompleteResponse, RecentSearchesResponse, SearchParams, SearchResponse } from "@/types/search.types";

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Search", "RecentSearches"],
  endpoints: (builder) => ({
    search: builder.query<SearchResponse, SearchParams>({
      query: (params) => ({ url: "/search", params }),
      providesTags: ["Search"],
    }),
    autocomplete: builder.query<AutocompleteResponse, string>({
      query: (q) => ({ url: "/search/autocomplete", params: { q } }),
    }),
    getRecentSearches: builder.query<RecentSearchesResponse, void>({
      query: () => "/search/recent",
      providesTags: ["RecentSearches"],
    }),
    deleteRecentSearch: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/search/recent/${id}`, method: "DELETE" }),
      invalidatesTags: ["RecentSearches"],
    }),
    clearRecentSearches: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/search/recent", method: "DELETE" }),
      invalidatesTags: ["RecentSearches"],
    }),
  }),
});

export const {
  useSearchQuery,
  useAutocompleteQuery,
  useGetRecentSearchesQuery,
  useDeleteRecentSearchMutation,
  useClearRecentSearchesMutation,
} = searchApi;
