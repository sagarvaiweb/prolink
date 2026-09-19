import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/baseQuery";
import { ApiResponse } from "@/types/auth.types";
import {
  Profile, UpdateProfilePayload, ExperiencePayload, EducationPayload, UpdateSkillsPayload,
} from "@/types/profile.types";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: baseQueryWithReauth, // every profile route is protected , reauth applies to all of them
  tagTypes: ["Profile"],

  endpoints: (builder) => ({

    getMyProfile: builder.query<ApiResponse<Profile>, void>({
      query: () => "/profiles/me",
      providesTags: ["Profile"],
    }),

    getProfileByUserId: builder.query<ApiResponse<Profile>, string>({
      query: (userId) => `/profiles/${userId}`,
    }),

    updateProfile: builder.mutation<ApiResponse<Profile>, UpdateProfilePayload>({
      query: (body) => ({ url: "/profiles/me", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),

    addExperience: builder.mutation<ApiResponse<Profile>, ExperiencePayload>({
      query: (body) => ({ url: "/profiles/me/experience", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),

    updateExperience: builder.mutation<ApiResponse<Profile>, { id: string; data: ExperiencePayload }>({
      query: ({ id, data }) => ({ url: `/profiles/me/experience/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Profile"],
    }),

    deleteExperience: builder.mutation<ApiResponse<Profile>, string>({
      query: (id) => ({ url: `/profiles/me/experience/${id}`, method: "DELETE" }),
      invalidatesTags: ["Profile"],
    }),

    addEducation: builder.mutation<ApiResponse<Profile>, EducationPayload>({
      query: (body) => ({ url: "/profiles/me/education", method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),

    updateEducation: builder.mutation<ApiResponse<Profile>, { id: string; data: EducationPayload }>({
      query: ({ id, data }) => ({ url: `/profiles/me/education/${id}`, method: "PATCH", body: data }),
      invalidatesTags: ["Profile"],
    }),

    deleteEducation: builder.mutation<ApiResponse<Profile>, string>({
      query: (id) => ({ url: `/profiles/me/education/${id}`, method: "DELETE" }),
      invalidatesTags: ["Profile"],
    }),

    updateSkills: builder.mutation<ApiResponse<Profile>, UpdateSkillsPayload>({
      query: (body) => ({ url: "/profiles/me/skills", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetMyProfileQuery, useGetProfileByUserIdQuery, useUpdateProfileMutation,
  useAddExperienceMutation, useUpdateExperienceMutation, useDeleteExperienceMutation,
  useAddEducationMutation, useUpdateEducationMutation, useDeleteEducationMutation,
  useUpdateSkillsMutation,
} = profileApi;