import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  CompanyJobsResponse,
  CompanyListParams,
  CompanyListResponse,
  CompanyMutationResponse,
  CompanyPayload,
  CompanyProfileResponse,
} from "@/types/company.types";

export const companiesApi = createApi({
  reducerPath: "companiesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Companies", "Company", "CompanyJobs"],
  endpoints: (builder) => ({
    searchCompanies: builder.query<CompanyListResponse, CompanyListParams>({
      query: (params) => ({ url: "/companies", params }),
      providesTags: (result) => [
        { type: "Companies", id: "LIST" },
        ...(result?.data.companies.map(({ _id }) => ({ type: "Company" as const, id: _id })) ?? []),
      ],
    }),
    getCompanyById: builder.query<CompanyProfileResponse, string>({
      query: (companyId) => `/companies/${companyId}`,
      providesTags: (_result, _error, id) => [{ type: "Company", id }],
    }),
    getCompanyJobs: builder.query<CompanyJobsResponse, { companyId: string; page: number; limit: number }>({
      query: ({ companyId, page, limit }) => ({ url: `/companies/${companyId}/jobs`, params: { page, limit } }),
      providesTags: (_result, _error, { companyId }) => [{ type: "CompanyJobs", id: companyId }],
    }),
    createCompany: builder.mutation<CompanyMutationResponse, CompanyPayload>({
      query: (body) => ({ url: "/companies", method: "POST", body }),
      invalidatesTags: [{ type: "Companies", id: "LIST" }],
    }),
    updateCompany: builder.mutation<CompanyMutationResponse, { companyId: string; data: Partial<CompanyPayload> }>({
      query: ({ companyId, data }) => ({ url: `/companies/${companyId}`, method: "PATCH", body: data }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "Company", id: companyId },
        { type: "Companies", id: "LIST" },
      ],
    }),
    followCompany: builder.mutation<{ data: { isFollowing: boolean; followerCount: number } }, string>({
      query: (id) => ({ url: `/companies/${id}/follow`, method: "POST" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Company", id }, { type: "Companies", id: "LIST" }],
    }),
    unfollowCompany: builder.mutation<{ data: { isFollowing: boolean; followerCount: number } }, string>({
      query: (id) => ({ url: `/companies/${id}/follow`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Company", id }, { type: "Companies", id: "LIST" }],
    }),
  }),
});

export const {
  useSearchCompaniesQuery,
  useGetCompanyByIdQuery,
  useGetCompanyJobsQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useFollowCompanyMutation,
  useUnfollowCompanyMutation,
} = companiesApi;
