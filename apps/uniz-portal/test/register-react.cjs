const Module = require("module");
const path = require("path");

// Recoil is hoisted next to the landing's React 19. Force every require("react")
// in the test process onto this app's React 18.
const portalModules = path.resolve(__dirname, "../node_modules");
const original = Module._resolveFilename;

function isPortalReact(request) {
  return (
    request === "react" ||
    request.startsWith("react/") ||
    request === "react-dom" ||
    request.startsWith("react-dom/")
  );
}

Module._resolveFilename = function (request, parent, isMain, options) {
  if (!isPortalReact(request)) {
    return original.call(this, request, parent, isMain, options);
  }
  return original.call(this, request, parent, isMain, {
    ...options,
    paths: [portalModules],
  });
};
