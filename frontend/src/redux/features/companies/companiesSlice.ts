import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface CompaniesState {
  activeCompanyId: string | null;
}

const initialState: CompaniesState = { activeCompanyId: null };

const companiesSlice = createSlice({
  name: "companies",
  initialState,
  reducers: {
    setActiveCompany(state, action: PayloadAction<string | null>) {
      state.activeCompanyId = action.payload;
    },
  },
});

export const { setActiveCompany } = companiesSlice.actions;
export default companiesSlice.reducer;
