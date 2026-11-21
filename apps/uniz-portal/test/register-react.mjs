import { register } from "node:module";

// Recoil is hoisted to the repo root and would otherwise bind the landing's
// React 19. The portal tests have to use this app's React 18.
register("./react-alias-hook.mjs", import.meta.url);
