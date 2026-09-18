"use client";
// "use client" tells Next.js: this file runs in the BROWSER i.e client side react features , not the server.
// Redux's <Provider> needs browser features, so this is required.

import { Provider } from "react-redux";
import { store } from "./store";

// This component wraps your entire app, giving every component access to the Redux store via useAppSelector/useAppDispatch.
export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}