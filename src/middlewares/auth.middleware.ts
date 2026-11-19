import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { errorResponse } from "../utils/response-handler";
import { tokenConfig, type AccessTokenPayload } from "../utils/token";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return errorResponse({
      res,
      message: "Unauthorized: Token not found",
      code: 401,
      shouldRefreshToken: true,
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return errorResponse({
      res,
      message: "Unauthorized: Invalid token format",
      code: 401,
    });
  }

  const token = authHeader.slice("Bearer ".length);

  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, tokenConfig.accessSecret) as AccessTokenPayload;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return errorResponse({
        res,
        message: "Unauthorized: Token expired",
        error: error.message,
        code: 401,
        shouldRefreshToken: true,
      });
    }

    return errorResponse({
      res,
      message: "Unauthorized: Invalid token",
      error: error.message,
      code: 401,
    });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id: payload.id, deletedAt: null },
      select: { id: true, email: true, name: true, photo: true },
    });

    if (!user) {
      return errorResponse({
        res,
        message: "Unauthorized: Invalid token",
        code: 401,
      });
    }

    // roles diisi oleh permission middleware (dibaca langsung dari DB).
    req.user = { ...user, roles: [] };
    next();
  } catch (error: any) {
    return errorResponse({ res, error: error.message, code: 500 });
  }
};
