import type { PrismaClient } from "../../src/generated/prisma/client";

interface PermissionConfig {
  name: string;
  description: string;
}

interface PermissionGroup {
  group: string;
  permissions: PermissionConfig[];
}

const permissionConfigs: PermissionGroup[] = [
  {
    group: "Role User",
    permissions: [
      { name: "role.view", description: "View role" },
      { name: "role.create", description: "Add new role" },
      { name: "role.update", description: "Update role" },
      { name: "role.delete", description: "Delete role" },
      { name: "role.permission", description: "View role permission" },
      {
        name: "role.syncPermission",
        description: "Sync permission for role",
      },
    ],
  },
  {
    group: "User Management",
    permissions: [
      { name: "user.view", description: "View user" },
      { name: "user.create", description: "Add new user" },
      { name: "user.update", description: "Update user" },
      { name: "user.delete", description: "Delete user" },
    ],
  },
];

export const permissionSeed = async (prisma: PrismaClient) => {
  console.log("⏳ Sync permission...");

  const configPermissionNames = permissionConfigs.flatMap((group) =>
    group.permissions.map((perm) => perm.name),
  );

  // Upsert: tambah yang baru, update yang sudah ada
  for (const [groupIndex, group] of permissionConfigs.entries()) {
    await Promise.all(
      group.permissions.map((perm, index) => {
        const fields = {
          group: group.group,
          description: perm.description,
          order: groupIndex + 1,
          orderInGroup: index + 1,
        };

        return prisma.permission.upsert({
          where: { name: perm.name },
          update: fields,
          create: { name: perm.name, ...fields },
        });
      }),
    );
  }

  // Hapus permission di DB yang sudah tidak ada lagi di config.
  // Relasi RolePermission ikut terhapus lewat onDelete: Cascade.
  const stalePermissions = await prisma.permission.findMany({
    where: { name: { notIn: configPermissionNames } },
    select: { id: true, name: true },
  });

  if (stalePermissions.length > 0) {
    await prisma.permission.deleteMany({
      where: { id: { in: stalePermissions.map((p) => p.id) } },
    });

    console.log(
      `   🗑️  ${stalePermissions.length} old permission deleted: ${stalePermissions
        .map((p) => p.name)
        .join(", ")}`,
    );
  }

  console.log(`✅ ${configPermissionNames.length} permission synced`);
};
