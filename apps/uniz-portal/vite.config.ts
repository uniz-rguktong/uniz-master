import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { UNIZ_CAMPUS_LABEL, UNIZ_TAGLINE } from "./src/constants/branding";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "inject-branding",
      transformIndexHtml(html) {
        return html
          .replace("__UNIZ_TAGLINE_LINE1__", UNIZ_TAGLINE.line1)
          .replace("__UNIZ_TAGLINE_LINE2__", UNIZ_TAGLINE.line2)
          .replaceAll("__UNIZ_CAMPUS_LABEL__", UNIZ_CAMPUS_LABEL);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_PROXY_TARGET || "http://127.0.0.1:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
