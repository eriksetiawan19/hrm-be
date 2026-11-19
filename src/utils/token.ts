import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

export type AccessTokenPayload = {
  id: string;
};

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

// Ubah format durasi JWT ("15m", "1d", ...) jadi milidetik untuk cookie maxAge
// dan expiresAt refresh token di DB.
const durationToMs = (value: string): number => {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(`Format durasi tidak valid: "${value}" (contoh: 15m, 1d)`);
  }
  return Number(match[1]) * DURATION_UNIT_MS[match[2]];
};

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
};

export const tokenConfig = {
  get accessSecret() {
    return requireEnv("JWT_ACCESS_SECRET");
  },
  get refreshSecret() {
    return requireEnv("JWT_REFRESH_SECRET");
  },
  get accessExpiresIn() {
    return (process.env.JWT_LIMIT_TOKEN || "15m") as SignOptions["expiresIn"];
  },
  get refreshExpiresIn() {
    return (process.env.JWT_LIMIT_REFRESH_TOKEN ||
      "1d") as SignOptions["expiresIn"];
  },
  get refreshExpiresInMs() {
    return durationToMs(process.env.JWT_LIMIT_REFRESH_TOKEN || "1d");
  },
};

export const generateToken = ({
  payload,
  expiresIn,
  key,
}: {
  payload: object;
  expiresIn: SignOptions["expiresIn"];
  key: string;
}) => jwt.sign(payload, key, { expiresIn });

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
