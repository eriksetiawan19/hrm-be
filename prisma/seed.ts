import { prisma } from "../src/lib/prisma";
import { permissionSeed } from "./seeds/permission.seeder";
import { userSeed } from "./seeds/user.seeder";

const main = async () => {
  // permission dulu, karena userSeed memberi permission ke role Root
  await permissionSeed(prisma);
  await userSeed(prisma);
};

main()
  .catch((error) => {
    console.error("❌ failed to seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
