import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type { SearchRequest, SearchResponse } from "@/types/search.types";

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
  }),
});

export const { useSearchQuery } = searchApi;
