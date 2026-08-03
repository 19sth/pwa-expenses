import { INavItem } from "../components/mulayout";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { APP_NAME } from "../utils/constants";

export interface PageState {
  navItems: INavItem[];
  title: string;
}

const initialState: PageState = {
  navItems: [],
  title: "",
};

export const pageSlice = createSlice({
  name: "page",
  initialState,
  reducers: {
    updatePageState: (state, action: PayloadAction<PageState>) => {
      state.navItems = action.payload.navItems;
      state.title = `${APP_NAME} ${
        action.payload.title ? " - " + action.payload.title : ""
      }`.toLowerCase();
    },
  },
});

export const { updatePageState } = pageSlice.actions;

export default pageSlice.reducer;
