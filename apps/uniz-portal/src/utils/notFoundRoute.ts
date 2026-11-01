/** True while the router catch-all 404 screen is mounted. */
let notFoundRouteActive = false;

export function setNotFoundRouteActive(active: boolean) {
  notFoundRouteActive = active;
}

export function isNotFoundRouteActive() {
  return notFoundRouteActive;
}
