import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import { authApi } from "./features/auth/authApi";

import { networkingApi } from "./features/networking/networkingApi";
import networkingReducer from "./features/networking/networkingSlice";
import { notificationApi } from "./features/notification/notificationApi";
import { profileApi } from "./features/profile/profileApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    networking: networkingReducer,
    [authApi.reducerPath]: authApi.reducer,
    [profileApi.reducerPath]: profileApi.reducer
    [networkingApi.reducerPath]: networkingApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      networkingApi.middleware,
      notificationApi.middleware
    ),
 
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
