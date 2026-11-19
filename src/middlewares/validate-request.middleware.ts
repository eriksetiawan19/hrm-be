import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { errorResponse } from "../utils/response-handler";

export interface ValidatedRequest<T> extends Request {
  validated?: T;
}

export const validateRequest =
  <T>(schema: z.ZodType<T>) =>
  (req: ValidatedRequest<T>, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const groupedErrors: Record<string, string[]> = {};

      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "_root";
        (groupedErrors[field] ??= []).push(issue.message);
      }

      return errorResponse({
        res,
        code: 422,
        message: "Validasi gagal, periksa data kembali",
        error: groupedErrors,
      });
    }

    req.validated = result.data;
    next();
  };
