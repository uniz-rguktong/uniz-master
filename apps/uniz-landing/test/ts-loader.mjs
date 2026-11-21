/**
 * Load TypeScript test files on Node 20, which has no --experimental-strip-types.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const TS = /\.[cm]?tsx?$/;

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !TS.test(new URL(url).pathname)) {
    return nextLoad(url, context);
  }
  const source = await readFile(fileURLToPath(url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
    },
    fileName: fileURLToPath(url),
  });
  return { format: "module", source: outputText, shortCircuit: true };
}
