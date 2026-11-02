import { Router } from "express";
import { feesLimiter as limiter } from "../middlewares/fees-ratelimit.middleware";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import * as c from "../controllers/fees.controller";

// No payment webhook route: online payments are coming soon.
export const feesRouter = Router();
feesRouter.use(authenticate, limiter, c.moduleGate as any);
feesRouter.get("/status", c.status as any);
feesRouter.post("/structures", c.createStructure as any);
feesRouter.get("/structures", c.listStructures as any);
feesRouter.post("/structures/:id/issue", c.issue as any);
feesRouter.get("/invoices", c.listInvoices as any);
feesRouter.get("/mine", c.mine as any);
feesRouter.post("/invoices/:id/pay", c.pay as any);
feesRouter.post("/invoices/:id/record", c.record as any);
