import type { PrismaClient } from "../../src/generated/prisma/client";
import bcrypt from "bcrypt";

const ROOT_ROLE_NAME = "Root";
const ROOT_USER = {
  name: "Erik Setiawan",
  email: "19eriksetiawan@gmail.com",
  password: "password",
};

export const userSeed = async (prisma: PrismaClient) => {
  console.log("⏳ Sync Root User and Role...");

  // Kalau root user sudah ada, anggap seeding root sudah selesai dan lewati
  // semuanya — tidak menyentuh password maupun permission yang sudah ada.
  const existingUser = await prisma.user.findUnique({
    where: { email: ROOT_USER.email },
  });

  if (existingUser) {
    console.log("⏭️  Root User has registered, seeding root user skipped.");
    return;
  }

  const role =
    (await prisma.role.findFirst({ where: { name: ROOT_ROLE_NAME } })) ??
    (await prisma.role.create({ data: { name: ROOT_ROLE_NAME } }));

  // Root hanya mendapat akses dari group "Role User"
  const permissions = await prisma.permission.findMany({
    where: { group: "Role User" },
    select: { id: true },
  });

  const hashedPassword = await bcrypt.hash(ROOT_USER.password, 12);

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
    prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
    }),
    prisma.user.create({
      data: {
        name: ROOT_USER.name,
        email: ROOT_USER.email,
        password: hashedPassword,
        roles: { create: { roleId: role.id } },
      },
    }),
  ]);

  console.log("✅ Root User and Role synced.");
};
