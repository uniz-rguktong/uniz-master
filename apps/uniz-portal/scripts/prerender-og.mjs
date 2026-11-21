import path from "node:path";
import { prerender } from "../../../scripts/og/prerender.mjs";
import { runDistCheck } from "../../../scripts/og/check.mjs";
import * as routes from "../og/routes.mjs";

const appDir = path.resolve(import.meta.dirname, "..");
const dist = await prerender({ appDir, routes });
const count = await runDistCheck(dist, routes);
console.log(`portal open graph shells ok (${count} routes)`);
