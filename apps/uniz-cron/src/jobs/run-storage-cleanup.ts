import { runStorageCleanup } from "../utils/storage";

runStorageCleanup()
  .then(() => {
    console.log("[STORAGE] Job finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[STORAGE] Job failed:", err);
    process.exit(1);
  });
