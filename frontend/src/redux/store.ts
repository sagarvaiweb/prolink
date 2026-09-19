import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import { authApi } from "./features/auth/authApi";
import { networkingApi } from "./features/networking/networkingApi";
import networkingReducer from "./features/networking/networkingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    networking: networkingReducer,
    [authApi.reducerPath]: authApi.reducer,
    [networkingApi.reducerPath]: networkingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, networkingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
