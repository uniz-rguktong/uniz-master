import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const portalPkg = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../package.json",
);
const require = createRequire(portalPkg);

function portalPackage(specifier) {
  if (specifier === "react" || specifier.startsWith("react/")) return true;
  if (specifier === "react-dom" || specifier.startsWith("react-dom/")) return true;
  return false;
}

export function resolve(specifier, context, nextResolve) {
  if (!portalPackage(specifier)) return nextResolve(specifier, context);
  return {
    url: pathToFileURL(require.resolve(specifier)).href,
    shortCircuit: true,
  };
}
