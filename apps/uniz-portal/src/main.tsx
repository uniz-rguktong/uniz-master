import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Layout } from "./layout.tsx";
import { RecoilRoot } from "recoil";
import { BrowserRouter } from "react-router-dom";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Registered globally:", registration.scope);
      })
      .catch((error) => {
        console.error("[SW] Registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <RecoilRoot>
    <BrowserRouter>
      <Layout>
        <App />
      </Layout>
    </BrowserRouter>
  </RecoilRoot>,
);
