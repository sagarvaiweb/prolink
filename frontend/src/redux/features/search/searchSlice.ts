import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  SearchCategory,
  SearchFilters,
  SearchMode,
  SearchState,
} from "@/types/search.types";

const initialState: SearchState = {
  query: "",
  activeType: "all",
  searchMode: "hybrid",
  activeFilters: {},
  page: 1,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
      state.page = 1;
    },
    setActiveType: (state, action: PayloadAction<SearchCategory>) => {
      state.activeType = action.payload;
      state.page = 1;
    },
    setSearchMode: (state, action: PayloadAction<SearchMode>) => {
      state.searchMode = action.payload;
      state.page = 1;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.activeFilters = action.payload;
      state.page = 1;
    },
    setSearchPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setSearchState: (state, action: PayloadAction<SearchState>) => {
      return action.payload;
    },
  },
});

export const {
  setActiveType,
  setFilters,
  setQuery,
  setSearchMode,
  setSearchPage,
  setSearchState,
} = searchSlice.actions;

export default searchSlice.reducer;
