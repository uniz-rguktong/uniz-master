import { Router } from "express";
import { libraryLimiter as limiter } from "../middlewares/library-ratelimit.middleware";
import { authMiddleware as authenticate } from "../middlewares/auth.middleware";
import * as c from "../controllers/library.controller";

export const libraryRouter = Router();
libraryRouter.use(authenticate, limiter, c.moduleGate as any);
libraryRouter.get("/status", c.status as any);
libraryRouter.get("/books", c.books as any);
libraryRouter.post("/books", c.addBook as any);
libraryRouter.post("/import", c.importCsv as any);
libraryRouter.post("/issue", c.issue as any);
libraryRouter.post("/return", c.giveBack as any);
libraryRouter.get("/loans", c.loans as any);
libraryRouter.get("/mine", c.mine as any);
libraryRouter.get("/fines", c.fines as any);
libraryRouter.post("/fines/:id/settle", c.settle as any);
libraryRouter.post("/remind", c.remind as any);
