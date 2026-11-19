import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateToken, hashToken, tokenConfig } from "../../utils/token";
import { getUserPermissionAndRoles } from "../role-permission/permission.service";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Buat access + refresh token baru dan simpan hash refresh token ke DB.
const createSession = async (user: SessionUser) => {
  const { permissions, roles } = await getUserPermissionAndRoles(user.id);

  const accessToken = generateToken({
    payload: { id: user.id },
    expiresIn: tokenConfig.accessExpiresIn,
    key: tokenConfig.accessSecret,
  });

  const refreshToken = generateToken({
    payload: { id: user.id },
    expiresIn: tokenConfig.refreshExpiresIn,
    key: tokenConfig.refreshSecret,
  });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + tokenConfig.refreshExpiresInMs),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      photo: user.photo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    accessToken,
    refreshToken,
    permissions,
    roles,
  };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });

  if (!user) return null;

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) return null;

  return createSession(user);
};

export const refreshSession = async (token: string | undefined) => {
  if (!token) return null;

  let payload: { id: string };
  try {
    payload = jwt.verify(token, tokenConfig.refreshSecret) as { id: string };
  } catch {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.id, deletedAt: null },
  });
  if (!user) return null;

  // Rotasi: refresh token lama hanya bisa dipakai sekali. deleteMany dipakai
  // sebagai cek + hapus atomik supaya dua request paralel dengan token yang
  // sama tidak sama-sama lolos.
  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: { gt: new Date() },
    },
  });
  if (count === 0) return null;

  return createSession(user);
};

export const logoutUser = async (token: string | undefined) => {
  if (!token) return;
  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
};
