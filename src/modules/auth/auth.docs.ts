import { z } from "zod";
import {
  registry,
  jsonContent,
  authSecurity,
  successEnvelope,
  errorContent,
  commonErrorResponses,
  validationErrorResponse,
} from "../../docs/registry";
import { docTags, type DocTag } from "../../docs/tags";
import { loginSchema } from "./login.schema";

const tags: DocTag[] = [docTags.auth];

const refreshCookieHeader = {
  "Set-Cookie": {
    description:
      "Cookie `refreshToken` (httpOnly). Dipakai oleh `POST /auth/refresh-token`.",
    schema: { type: "string" as const },
  },
};

const RoleSchema = z.object({
  id: z.string(),
  name: z.string().openapi({ example: "Root" }),
});

const SessionUserSchema = registry.register(
  "SessionUser",
  z.object({
    id: z.string(),
    email: z.string().openapi({ example: "admin@example.com" }),
    name: z.string().openapi({ example: "Admin" }),
    photo: z.string().nullable(),
    createdAt: z.string().openapi({ format: "date-time" }),
    updatedAt: z.string().openapi({ format: "date-time" }),
  }),
);

const PermissionsSchema = z
  .array(z.string())
  .openapi({ example: ["role.view", "role.create"] });

const SessionSchema = registry.register(
  "Session",
  z.object({
    user: SessionUserSchema,
    accessToken: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIs..." }),
    permissions: PermissionsSchema,
    roles: z.array(RoleSchema),
  }),
);

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags,
  summary: "Login",
  description:
    "Login dengan email dan password. Response berisi `accessToken` (dipakai sebagai Bearer token) dan memasang cookie `refreshToken`.",
  request: { body: { content: jsonContent(loginSchema) } },
  responses: {
    200: {
      description: "Login berhasil",
      headers: refreshCookieHeader,
      content: jsonContent(successEnvelope(SessionSchema)),
    },
    ...validationErrorResponse,
    401: { description: "Email atau password salah", content: errorContent },
    500: { description: "Kesalahan server", content: errorContent },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh-token",
  tags,
  summary: "Refresh Token",
  description:
    "Menerbitkan `accessToken` baru dari cookie `refreshToken`. Cookie dikirim otomatis oleh browser (pakai `credentials: include`). Refresh token lama langsung tidak berlaku dan cookie diganti baru.",
  responses: {
    200: {
      description: "Refresh token berhasil",
      headers: refreshCookieHeader,
      content: jsonContent(successEnvelope(SessionSchema)),
    },
    401: {
      description: "Refresh token tidak ada, kedaluwarsa, atau sudah dipakai",
      content: errorContent,
    },
    500: { description: "Kesalahan server", content: errorContent },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags,
  summary: "Logout",
  description:
    "Mencabut refresh token di DB dan menghapus cookie `refreshToken`.",
  responses: {
    200: {
      description: "Logout berhasil",
      content: jsonContent(successEnvelope(z.object({}))),
    },
    500: { description: "Kesalahan server", content: errorContent },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags,
  summary: "Get Current User",
  description:
    "User yang sedang login beserta roles dan permission terkini. Tidak butuh permission khusus.",
  security: authSecurity,
  responses: {
    200: {
      description: "Berhasil",
      content: jsonContent(
        successEnvelope(
          z.object({
            user: SessionUserSchema.pick({
              id: true,
              email: true,
              name: true,
              photo: true,
            }).extend({ roles: z.array(RoleSchema) }),
            permissions: PermissionsSchema,
          }),
        ),
      ),
    },
    401: commonErrorResponses[401],
    500: commonErrorResponses[500],
  },
});
