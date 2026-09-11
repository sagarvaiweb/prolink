import { createApi, fetchBaseQuery, FetchArgs, FetchBaseQueryError} from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { RootState } from "@/redux/store";
import { setCredentials, setAccessToken, setUser, clearCredentials } from "./authSlice";
import {ApiResponse, User, LoginData, RegisterPayload, LoginPayload} from "@/types/auth.types";

// Plain base query , attaches token IF one exists, harmless when it doesn't
const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  credentials: "include",
  
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Auto-refresh wrapper , only used by endpoints that explicitly call it
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: "/auth/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const newToken = (
        refreshResult.data as ApiResponse<{ accessToken: string }>
      ).data.accessToken;
      api.dispatch(setAccessToken(newToken));
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

 // RTK Query API slice for auth-related endpoints
export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery, // default = plain, used by register/login

  endpoints: (builder) => ({
    register: builder.mutation<ApiResponse<User>, RegisterPayload>({
      query: (formData) => ({
        url: "/auth/register",
        method: "POST",
        body: formData,
      }),

      async onQueryStarted(_formData, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(setUser(response.data.data));
        } catch {
          // No action needed on failure; error handling is done in the component using setError
        }
      },
    }),

    login: builder.mutation<ApiResponse<LoginData>, LoginPayload>({
      query: (formData) => ({
        url: "/auth/login",
        method: "POST",
        body: formData,
      }),

      async onQueryStarted(_formData, { dispatch, queryFulfilled }) {
        try {
          const response = await queryFulfilled;
          dispatch(setCredentials(response.data.data));
        } catch {
          // No action needed on failure; error handling is done in the component using setError
        }
      },
    }),

    
  }),
});

export const { useRegisterMutation, useLoginMutation } = authApi;