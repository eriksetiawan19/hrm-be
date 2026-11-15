import express, { Request, Response } from "express";
import { errorResponse, successResponse } from "./utils/response-handler";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  return successResponse({ res, message: "API is running" });
});

app.listen(PORT, () => console.log(`Running on ${PORT}`));

app.use((req: Request, res: Response) => {
  return errorResponse({
    res,
    code: 404,
    message: `Route ${req.method} ${req.path} not found`,
  });
});
