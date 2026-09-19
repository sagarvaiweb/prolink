import { fetchBaseQuery, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { RootState } from "./store";
import { setAccessToken, clearCredentials } from "./features/auth/authSlice";
import { ApiResponse } from "@/types/auth.types";

// Plain fetcher , attaches token if one exists, harmless when it doesn't
export const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include",

  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Auto-refresh wrapper ,  any API slice needing protected routes imports this
export const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {

  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: "/auth/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const newToken = (refreshResult.data as ApiResponse<{ accessToken: string }>).data.accessToken;
      api.dispatch(setAccessToken(newToken));
      result = await baseQuery(args, api, extraOptions); // retry original request
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;  
};