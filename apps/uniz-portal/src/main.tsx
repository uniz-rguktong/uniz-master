import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Layout } from "./layout.tsx";
import { RecoilRoot } from "recoil";
import { BrowserRouter } from "react-router-dom";
// import { initializeGlobalInterceptor } from "./api/networkInterceptor.ts";

// initializeGlobalInterceptor();

// // Hardcoded Responsive Lead Signature 
// (function() {
//     const wideSignature = `
//         ███████╗██████╗ ███████╗███████╗  ██████╗██╗  ██╗ █████╗ ██████╗  █████╗ ███╗   ██╗
//         ██╔════╝██╔══██╗██╔════╝██╔════╝ ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗████╗  ██║
//         ███████╗██████╔╝█████╗  █████╗   ██║     ███████║███████║██████╔╝███████║██╔██╗ ██║
//         ╚════██║██╔══██╗██╔══╝  ██╔══╝   ██║     ██╔══██║██╔══██║██╔══██╗██╔══██║██║╚██╗██║
//         ███████║██║  ██║███████╗███████╗ ╚██████╗██║  ██║██║  ██║██║  ██║██║  ██║██║ ╚████║
//         ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝
//     `;

//     const compactSignature = `
//          ██████╗██╗  ██╗ █████╗ ██████╗  █████╗ ███╗   ██╗
//         ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔══██╗████╗  ██║
//         ██║     ███████║███████║██████╔╝███████║██╔██╗ ██║
//         ██║     ██╔══██║██╔══██║██╔══██╗██╔══██║██║╚██╗██║
//         ╚██████╗██║  ██║██║  ██║██║  ██║██║  ██║██║ ╚████║
//          ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
//     `;

//     const logSignature = () => {
//         const isWide = window.innerWidth > 900;
//         if (isWide) {
//             console.log(`%c${wideSignature}`, "color: #ffffff; font-weight: bold; font-family: monospace; line-height: 1.2;");
//         } else {
//             console.log(`%c${compactSignature}`, "color: #ffffff; font-weight: bold; font-family: monospace; line-height: 1.2;");
//         }
//     };

//     logSignature();
//     window.addEventListener('resize', logSignature);
// })();

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
