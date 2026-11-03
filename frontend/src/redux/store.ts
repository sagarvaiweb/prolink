import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import { authApi } from "./features/auth/authApi";
import { profileApi } from "./features/profile/profileApi";
import { networkApi } from "./features/network/networkApi";
import { postsApi } from "./features/posts/postsApi";
import { jobsApi } from "./features/jobs/jobsApi";
import { applicationsApi } from "./features/jobs/applicationsApi";
import { notificationsApi } from "./features/notifications/notificationsApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer,
    [networkApi.reducerPath]: networkApi.reducer,
    [postsApi.reducerPath]: postsApi.reducer,
    [jobsApi.reducerPath]: jobsApi.reducer,
    [applicationsApi.reducerPath]: applicationsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      profileApi.middleware,
      networkApi.middleware,
      postsApi.middleware,
      jobsApi.middleware,
      applicationsApi.middleware,
      notificationsApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
