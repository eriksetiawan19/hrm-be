import type { Response } from "express";
import { AppError } from "./app-error.js";

type ApiStatus = "success" | "error";

export type ApiError = string | string[] | Record<string, string[]> | null;

type ApiResponse<T = any> = {
  code: number;
  status: ApiStatus;
  message: string;
  data: T;
  error?: ApiError;
  shouldRefreshToken?: boolean;
};

type BaseResponse<T> = {
  res: Response;
  message?: string;
  data?: T;
  code?: number;
  error?: ApiError;
  shouldRefreshToken?: boolean;
};

export const successResponse = <T = any>({
  res,
  message = "Success",
  data = {} as T,
  code = 200,
}: BaseResponse<T>) => {
  const response: ApiResponse<T> = {
    code,
    status: "success",
    message,
    data,
  };

  return res.status(code).json(response);
};

type HandleErrorParams = {
  res: Response;
  error: any;
  message?: string;
};

export const handleError = ({
  res,
  error,
  message = "Terjadi kesalahan",
}: HandleErrorParams) => {
  const isKnown = error instanceof AppError;

  return errorResponse({
    res,
    code: isKnown ? error.code : 500,
    message: isKnown ? error.message : message,
    error: error?.message ?? null,
  });
};

export const errorResponse = <T = any>({
  res,
  message = "Terjadi kesalahan",
  data = {} as T,
  error = null,
  code = 500,
  shouldRefreshToken = false,
}: BaseResponse<T>) => {
  const response: ApiResponse<T> = {
    code,
    status: "error",
    message,
    data,
    error,
    ...(shouldRefreshToken && { shouldRefreshToken }),
  };

  return res.status(code).json(response);
};
