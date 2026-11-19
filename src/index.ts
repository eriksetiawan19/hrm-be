import "dotenv/config";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { errorResponse, successResponse } from "./utils/response-handler";
import authRoutes from "./modules/auth/auth.routes";
import docsRoutes from "./docs/openapi";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
  return successResponse({ res, message: "API is running" });
});

// Docs (/docs dan /openapi.json) tidak dipasang di production.
if (process.env.NODE_ENV !== "production") {
  app.use(docsRoutes);
}

app.use("/auth", authRoutes);

app.use((req: Request, res: Response) => {
  return errorResponse({
    res,
    code: 404,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

app.listen(PORT, () => console.log(`Running on ${PORT}`));
