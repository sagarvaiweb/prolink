import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import type {
  CompanyJobsResponse,
  CompanyListParams,
  CompanyListResponse,
  CompanyMutationResponse,
  CompanyMembersResponse,
  CompanyMemberResponse,
  CompanyActionResponse,
  CompanyRole,
  CompanyPayload,
  CompanyProfileResponse,
  RecruiterCandidatesResponse,
} from "@/types/company.types";

export const companiesApi = createApi({
  reducerPath: "companiesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Companies", "Company", "CompanyJobs", "CompanyMembers", "RecruiterCandidates"],
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
    getCompanyMembers: builder.query<CompanyMembersResponse, { companyId: string; page: number; limit: number }>({
      query: ({ companyId, page, limit }) => ({ url: `/companies/${companyId}/members`, params: { page, limit } }),
      providesTags: (result, _error, { companyId }) => [
        { type: "CompanyMembers", id: companyId },
        ...(result?.data.members.map(({ _id }) => ({ type: "CompanyMembers" as const, id: _id })) ?? []),
      ],
    }),
    searchRecruiterCandidates: builder.query<RecruiterCandidatesResponse, { companyId: string; search: string; page: number; limit: number }>({
      query: ({ companyId, ...params }) => ({ url: `/companies/${companyId}/recruiter-candidates`, params }),
      providesTags: (_result, _error, { companyId }) => [{ type: "RecruiterCandidates", id: companyId }],
    }),
    addCompanyMember: builder.mutation<CompanyMemberResponse, { companyId: string; userId: string; role: Extract<CompanyRole, "admin" | "recruiter"> }>({
      query: ({ companyId, userId, role }) => ({ url: `/companies/${companyId}/members`, method: "POST", body: { userId, role } }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "CompanyMembers", id: companyId },
        { type: "RecruiterCandidates", id: companyId },
      ],
    }),
    removeCompanyMember: builder.mutation<CompanyActionResponse, { companyId: string; userId: string }>({
      query: ({ companyId, userId }) => ({ url: `/companies/${companyId}/members/${userId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { companyId }) => [
        { type: "CompanyMembers", id: companyId },
        { type: "RecruiterCandidates", id: companyId },
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
  useGetCompanyMembersQuery,
  useSearchRecruiterCandidatesQuery,
  useAddCompanyMemberMutation,
  useRemoveCompanyMemberMutation,
  useFollowCompanyMutation,
  useUnfollowCompanyMutation,
} = companiesApi;
