import path from "node:path";
import { runCheck } from "../../../scripts/og/check.mjs";
import * as routes from "../og/routes.mjs";

const count = await runCheck(routes, {
  pngDir: path.resolve(import.meta.dirname, "../public/og"),
});
console.log(`landing open graph ok (${count} routes)`);
