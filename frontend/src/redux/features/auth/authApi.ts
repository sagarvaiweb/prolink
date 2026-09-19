import { createApi,  FetchBaseQueryError} from "@reduxjs/toolkit/query/react";
import { baseQuery, baseQueryWithReauth } from "@/redux/baseQuery";
import { setCredentials, setUser } from "./authSlice";
import {ApiResponse, User, LoginData, RegisterPayload, LoginPayload , ResendVerificationPayload , VerifyEmailPayload ,
  ForgotPasswordPayload, ResetPasswordPayload} from "@/types/auth.types";


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


    verifyEmail: builder.mutation<ApiResponse<{ _id: string; email: string; isEmailVerified: boolean }>,VerifyEmailPayload>({
      query: (body) => ({
         url: "/auth/verify-email", 
         method: "POST", 
         body }),
    }),


    resendVerification: builder.mutation<ApiResponse<{ email: string; message: string }>,ResendVerificationPayload>({
      query: (body) => ({ 
        url: "/auth/resend-verification", 
        method: "POST", 
        body }),
    }),


   
    forgotPassword: builder.mutation<ApiResponse<{ email: string; message: string }>, ForgotPasswordPayload>({
      query: (body) => ({ 
        url: "/auth/forgot-password", 
        method: "POST", 
        body }),
    }),

  
    resetPassword: builder.mutation<ApiResponse<{ message: string }>, ResetPasswordPayload>({
      query: (body) => ({ 
        url: "/auth/reset-password", 
        method: "POST", 
        body }),
    }),

        // Protected route , uses baseQueryWithReauth via queryFn, since the default baseQuery above is plain
    getCurrentUser: builder.query<ApiResponse<User>, void>({
     queryFn: async (_arg, api, extraOptions) => {
     const result = await baseQueryWithReauth("/auth/me", api, extraOptions);
     return result as { data: ApiResponse<User> } | { error: FetchBaseQueryError };
    },

     async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
     try {
       const response = await queryFulfilled;
       dispatch(setUser(response.data.data));
     } catch {
        // No action needed on failure; error handling is done in the component using setError
     }
  },

  }),

    
  }),
});


export const { useRegisterMutation, useLoginMutation , useVerifyEmailMutation, useResendVerificationMutation ,
  useForgotPasswordMutation, useResetPasswordMutation , useGetCurrentUserQuery } = authApi;