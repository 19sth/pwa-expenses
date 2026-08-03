import { configureStore, type Middleware } from "@reduxjs/toolkit";
import pageReducer from "./slicePage";
import expensesReducer from "./sliceExpenses";

export const KEY_LOCALSTORAGE = "app-state-expenses"

const localStorageMiddleware: Middleware = ({ getState }) => (next) => (action) => {
  const result = next(action);
  localStorage.setItem(KEY_LOCALSTORAGE, JSON.stringify(getState()));
  return result;
};

const reHydrateStore = () => {
  let strJson = "{}";
  strJson = localStorage.getItem(KEY_LOCALSTORAGE) || "{}";
  return JSON.parse(strJson);
};

export const store = configureStore({
  reducer: {
    page: pageReducer,
    expenses: expensesReducer,
  },
  preloadedState: reHydrateStore(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
