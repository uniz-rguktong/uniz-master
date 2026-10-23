declare module "uniz-auth-service/createApp" {
  import type { Application } from "express";
  export function createApp(): Application;
  export default createApp;
}

declare module "uniz-user-service/createApp" {
  import type { Application } from "express";
  export function createApp(): Application;
  export default createApp;
}

declare module "uniz-academics-service/createApp" {
  import type { Application } from "express";
  export function createApp(): Application;
  export default createApp;
}
