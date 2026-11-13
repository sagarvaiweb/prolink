import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SearchMode, SearchType } from "@/types/search.types";

interface SearchState {
  query: string;
  activeType: SearchType;
  searchMode: SearchMode;
  page: number;
}

const initialState: SearchState = { query: "", activeType: "all", searchMode: "keyword", page: 1 };

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearchRequest(state, action: PayloadAction<Partial<SearchState>>) {
      Object.assign(state, action.payload);
    },
    clearSearch(state) {
      Object.assign(state, initialState);
    },
  },
});

export const { setSearchRequest, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
