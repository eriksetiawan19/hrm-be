import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate-request.middleware";
import { loginSchema } from "./login.schema";
import {
  loginAction,
  logoutAction,
  meAction,
  refreshTokenAction,
} from "./auth.controller";

const authRoutes = Router();

authRoutes.post("/login", validateRequest(loginSchema), loginAction);
authRoutes.post("/refresh-token", refreshTokenAction);
authRoutes.post("/logout", logoutAction);
authRoutes.get("/me", authenticate, meAction);

export default authRoutes;
