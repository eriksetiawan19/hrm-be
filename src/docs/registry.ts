import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Menambahkan method `.openapi()` ke semua schema Zod. Harus jalan sebelum
// file *.docs.ts memanggil `.openapi()`, jadi file docs wajib import dari sini.
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Access token dari endpoint login.",
  },
);

/** Dipakai di `security` setiap endpoint yang memakai middleware `authenticate`. */
export const authSecurity = [{ [bearerAuth.name]: [] }];

/** Format response sukses dari `successResponse()`. */
export const successEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    code: z.number().openapi({ example: 200 }),
    status: z.literal("success"),
    message: z.string().openapi({ example: "Success" }),
    data,
  });

/** Format response error dari `errorResponse()` / `handleError()`. */
export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    code: z.number().openapi({ example: 422 }),
    status: z.literal("error"),
    message: z.string().openapi({ example: "Terjadi kesalahan" }),
    data: z.object({}),
    error: z
      .union([
        z.string(),
        z.array(z.string()),
        z.record(z.string(), z.array(z.string())),
      ])
      .nullable(),
    shouldRefreshToken: z.boolean().optional(),
  }),
);

/** Bungkus schema menjadi `content` JSON untuk request body / response. */
export const jsonContent = <T extends z.ZodTypeAny>(schema: T) => ({
  "application/json": { schema },
});

export const errorContent = jsonContent(ErrorResponseSchema);

/** Response error yang umum untuk endpoint ber-auth + permission. */
export const commonErrorResponses = {
  401: {
    description: "Token tidak ada atau tidak valid",
    content: errorContent,
  },
  403: { description: "Tidak punya permission", content: errorContent },
  500: { description: "Kesalahan server", content: errorContent },
};

/** Dari `validateRequest()`: field error dikirim di `error` per nama field. */
export const validationErrorResponse = {
  422: { description: "Validasi request gagal", content: errorContent },
};
