import path from "node:path";
// Vendored from scripts/og so the app-directory Docker context can build.
import { prerender } from "./og/prerender.mjs";
import { runDistCheck } from "./og/check.mjs";
import * as routes from "../og/routes.mjs";

const appDir = path.resolve(import.meta.dirname, "..");
const dist = await prerender({ appDir, routes });
const count = await runDistCheck(dist, routes);
console.log(`landing open graph shells ok (${count} routes)`);
