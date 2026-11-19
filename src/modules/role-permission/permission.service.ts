import { prisma } from "../../lib/prisma";

export type UserPermissionAndRoles = {
  permissions: string[];
  roles: Array<{ id: string; name: string }>;
};

// Tanpa cache: permission selalu dibaca dari DB, jadi perubahan role/permission
// langsung berlaku di request berikutnya tanpa perlu versioning atau
// invalidasi cache.
export const getUserPermissionAndRoles = async (
  userId: string,
): Promise<UserPermissionAndRoles> => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, role: { deletedAt: null } },
    select: {
      role: {
        select: {
          id: true,
          name: true,
          permissions: { select: { permission: { select: { name: true } } } },
        },
      },
    },
  });

  const permissions = [
    ...new Set(
      userRoles.flatMap((ur) =>
        ur.role.permissions.map((rp) => rp.permission.name),
      ),
    ),
  ];

  const roles = userRoles.map((ur) => ({ id: ur.role.id, name: ur.role.name }));

  return { permissions, roles };
};
