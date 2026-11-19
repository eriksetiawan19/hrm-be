import type { CookieOptions, Request, Response } from "express";
import {
  errorResponse,
  handleError,
  successResponse,
} from "../../utils/response-handler";
import { tokenConfig } from "../../utils/token";
import { getUserPermissionAndRoles } from "../role-permission/permission.service";
import { loginUser, logoutUser, refreshSession } from "./auth.service";
import type { ValidatedRequest } from "../../middlewares/validate-request.middleware";
import type { LoginInput } from "./login.schema";

const REFRESH_COOKIE = "refreshToken";

const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, {
    ...refreshCookieOptions(),
    maxAge: tokenConfig.refreshExpiresInMs,
  });
};

export const loginAction = async (
  req: ValidatedRequest<LoginInput>,
  res: Response,
) => {
  try {
    const { email, password } = req.validated!;

    const result = await loginUser(email, password);
    if (!result) {
      return errorResponse({
        res,
        message: "Periksa email dan password anda",
        code: 401,
      });
    }

    const { refreshToken, ...data } = result;
    setRefreshCookie(res, refreshToken);

    return successResponse({ res, message: "Login berhasil", data });
  } catch (error) {
    return handleError({ res, error });
  }
};

export const refreshTokenAction = async (req: Request, res: Response) => {
  try {
    const result = await refreshSession(req.cookies?.[REFRESH_COOKIE]);
    if (!result) {
      return errorResponse({ res, message: "Periksa token anda", code: 401 });
    }

    const { refreshToken, ...data } = result;
    setRefreshCookie(res, refreshToken);

    return successResponse({ res, message: "Refresh token berhasil", data });
  } catch (error) {
    return handleError({ res, error });
  }
};

export const logoutAction = async (req: Request, res: Response) => {
  try {
    await logoutUser(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return successResponse({ res, message: "Logout berhasil" });
  } catch (error) {
    return handleError({ res, error });
  }
};

// Data user yang sedang login beserta roles & permission terkini, dipakai
// frontend untuk menampilkan/menyembunyikan menu.
export const meAction = async (req: Request, res: Response) => {
  try {
    const { permissions, roles } = await getUserPermissionAndRoles(
      req.user!.id,
    );
    return successResponse({
      res,
      data: { user: { ...req.user, roles }, permissions },
    });
  } catch (error) {
    return handleError({ res, error });
  }
};
