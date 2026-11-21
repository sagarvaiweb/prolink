import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  SearchCategory,
  SearchAutocompleteResponse,
  SearchRequest,
  SearchResponse,
} from "@/types/search.types";

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    search: builder.query<SearchResponse, SearchRequest>({
      query: (params) => ({
        url: "/search",
        params,
      }),
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
  }),
});

export const { useAutocompleteQuery, useSearchQuery } = searchApi;
