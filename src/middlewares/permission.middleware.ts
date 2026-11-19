import type { NextFunction, Request, Response } from "express";
import { getUserPermissionAndRoles } from "../modules/role-permission/permission.service";
import { errorResponse } from "../utils/response-handler";

type PermissionMode = "any" | "all";

const checkPermission = (
  required: string[],
  owned: string[],
  mode: PermissionMode,
) => {
  if (mode === "all") {
    return required.every((perm) => owned.includes(perm));
  }
  return required.some((perm) => owned.includes(perm));
};

// Wajib dipasang setelah `authenticate`.
const guard = (permissions: string[], mode: PermissionMode) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse({ res, message: "Unauthorized", code: 401 });
    }

    try {
      const current = await getUserPermissionAndRoles(req.user.id);

      // Roles terkini dari DB jadi sumber kebenaran, perubahan role
      // langsung berlaku tanpa user perlu login ulang.
      req.user.roles = current.roles;

      if (!checkPermission(permissions, current.permissions, mode)) {
        return errorResponse({
          res,
          message: "Anda tidak memiliki hak akses untuk aksi ini.",
          code: 403,
        });
      }

      next();
    } catch (error: any) {
      return errorResponse({ res, error: error.message, code: 500 });
    }
  };
};

// Lolos jika user punya salah satu permission (OR).
export const can = (...permissions: string[]) => guard(permissions, "any");

// Alias eksplisit untuk OR.
export const canAny = (...permissions: string[]) => guard(permissions, "any");

// Lolos hanya jika user punya SEMUA permission (AND).
export const canAll = (...permissions: string[]) => guard(permissions, "all");
