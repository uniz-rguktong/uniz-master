import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";
import { ErrorCode } from "../shared/error-codes";

export const validateRequest =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Validation failed",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
