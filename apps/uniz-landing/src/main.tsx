import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/noto-serif/wght.css";
import "./index.css";
import App from "./App.tsx";

document.documentElement.classList.remove("dark");
document.documentElement.style.colorScheme = "light";
try {
  localStorage.removeItem("uniz-landing-theme");
} catch {
  /* storage unavailable */
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
