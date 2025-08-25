import { PrismaClient, AccessLevel, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "melenciojrl@gmail.com";
  const passwordHash = await bcrypt.hash("Admin12345!", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { accessLevel: AccessLevel.ADMIN, role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, name: "Super Admin" },
    create: { email: adminEmail, accessLevel: AccessLevel.ADMIN, role: Role.SUPER_ADMIN, status: UserStatus.ACTIVE, name: "Super Admin", passwordHash },
  });

  console.log("Seeded Super Admin:", adminEmail);
}

main().finally(() => prisma.$disconnect());
