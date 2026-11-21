import path from "node:path";
import { assertOgCopies } from "../../../scripts/og/sync-check.mjs";
import { runCheck } from "./og/check.mjs";
import * as routes from "../og/routes.mjs";

await assertOgCopies();

const count = await runCheck(routes, {
  pngDir: path.resolve(import.meta.dirname, "../public/og"),
});
console.log(`landing open graph ok (${count} routes)`);
