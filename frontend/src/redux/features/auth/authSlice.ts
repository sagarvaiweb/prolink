import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, LoginData } from "@/types/auth.types";

// Shape of the auth data we keep in Redux (not the API response shape —
// just what the app actually needs to read on every render)
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isEmailVerified: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,


  // These are called manually (from authApi.ts's onQueryStarted, or on logout),
  // not automatically triggered by another thunk/slice.
  reducers: {
    // Called after a successful LOGIN — we get both user + token together
    setCredentials: (state, action: PayloadAction<LoginData>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isEmailVerified = action.payload.user.isEmailVerified;
    },

    // Called after a silent token REFRESH , we only get a new token, not a new user
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
    },

    // Called after REGISTER-backend returns the created user, but no token yet
    // (user must verify email / log in separately)
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isEmailVerified = action.payload.isEmailVerified;
    },

    // Called on logout, or when refresh fails and the session can't continue
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isEmailVerified = false;
    },
  },
});

export const { setCredentials, setAccessToken, setUser, clearCredentials } = authSlice.actions;
export default authSlice.reducer;