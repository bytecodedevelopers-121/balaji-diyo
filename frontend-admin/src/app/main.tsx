import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import { AppProviders } from "./provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
);
