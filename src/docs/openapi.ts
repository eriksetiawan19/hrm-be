import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { apiReference } from "@scalar/express-api-reference";
import { Router } from "express";
import { registry } from "./registry";
import { docTags, type DocTag } from "./tags";

// Daftarkan docs tiap modul di sini. Import ini hanya untuk side effect
// (registry.registerPath), jadi urutannya harus setelah registry.
// Urutan import = urutan endpoint di dalam tag yang sama.
import "../modules/auth/auth.docs";

// Urutan di sini = urutan tag di sidebar docs.
const tagDefinitions: Array<{ name: DocTag; description?: string }> = [
  {
    name: docTags.auth,
    description:
      "Login, refresh token, logout, dan profil user yang sedang login.",
  },
];

// Dibuat sekali saja: registry tidak berubah setelah server jalan.
let cachedDocument: ReturnType<OpenApiGeneratorV31["generateDocument"]> | null =
  null;

const generateOpenApiDocument = () => {
  cachedDocument ??= new OpenApiGeneratorV31(
    registry.definitions,
  ).generateDocument({
    openapi: "3.1.0",
    info: {
      title: "HRM API",
      version: "1.0.0",
    },
    tags: tagDefinitions,
  });
  return cachedDocument;
};

const docsRoutes = Router();

docsRoutes.get("/openapi.json", (_req, res) => {
  res.json(generateOpenApiDocument());
});

docsRoutes.use(
  "/docs",
  apiReference({
    url: "/openapi.json",
    pageTitle: "HRM API Docs",
  }),
);

export default docsRoutes;
