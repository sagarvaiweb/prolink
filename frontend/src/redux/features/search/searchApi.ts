import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  SearchCategory,
  SearchAutocompleteResponse,
  RecentSearchEntry,
  SearchRequest,
  SearchResponse,
} from "@/types/search.types";

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RecentSearch"],
  endpoints: (builder) => ({
    search: builder.query<SearchResponse, SearchRequest>({
      query: (params) => ({
        url: "/search",
        params,
      }),
      async onQueryStarted(_params, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(searchApi.util.invalidateTags(["RecentSearch"]));
        } catch {
          return;
        }
      },
    }),
    autocomplete: builder.query<
      { data: SearchAutocompleteResponse },
      { q: string; type: SearchCategory }
    >({
      query: ({ q, type }) => ({
        url: "/search/autocomplete",
        params: { q, type, limit: 6 },
      }),
    }),
    recentSearches: builder.query<{ data: RecentSearchEntry[] }, void>({
      query: () => ({ url: "/search/recent", params: { limit: 10 } }),
      providesTags: ["RecentSearch"],
      keepUnusedDataFor: 0,
    }),
    deleteRecentSearch: builder.mutation<{ data: null }, string>({
      query: (id) => ({ url: `/search/recent/${id}`, method: "DELETE" }),
      invalidatesTags: ["RecentSearch"],
    }),
    clearRecentSearches: builder.mutation<{ data: null }, void>({
      query: () => ({ url: "/search/recent", method: "DELETE" }),
      invalidatesTags: ["RecentSearch"],
    }),
  }),
});

export const {
  useAutocompleteQuery,
  useClearRecentSearchesMutation,
  useDeleteRecentSearchMutation,
  useRecentSearchesQuery,
  useSearchQuery,
} = searchApi;
