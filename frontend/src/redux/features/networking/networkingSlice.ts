import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { NetworkingContext } from "@/types/networking.types";

export interface NetworkingState {
  activeContext: NetworkingContext;
  selectedUserId: string | null;
  selectedConnectionId: string | null;
}

const initialState: NetworkingState = {
  activeContext: "connections",
  selectedUserId: null,
  selectedConnectionId: null,
};

const networkingSlice = createSlice({
  name: "networking",
  initialState,
  reducers: {
    setActiveContext: (state, action: PayloadAction<NetworkingContext>) => {
      state.activeContext = action.payload;
    },
    setSelectedUserId: (state, action: PayloadAction<string | null>) => {
      state.selectedUserId = action.payload;
    },
    setSelectedConnectionId: (state, action: PayloadAction<string | null>) => {
      state.selectedConnectionId = action.payload;
    },
    clearSelection: (state) => {
      state.selectedUserId = null;
      state.selectedConnectionId = null;
    },
    resetNetworkingState: () => initialState,
  },
});

export const {
  setActiveContext,
  setSelectedUserId,
  setSelectedConnectionId,
  clearSelection,
  resetNetworkingState,
} = networkingSlice.actions;

export const selectNetworkingState = (state: RootState) => state.networking;
export const selectActiveNetworkingContext = (state: RootState) =>
  state.networking.activeContext;
export const selectSelectedNetworkingUserId = (state: RootState) =>
  state.networking.selectedUserId;
export const selectSelectedConnectionId = (state: RootState) =>
  state.networking.selectedConnectionId;

export default networkingSlice.reducer;
