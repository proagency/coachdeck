import { PrismaClient, Role, AccessLevel, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const adminEmail = "melenciojrl@gmail.com";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.SUPER_ADMIN, accessLevel: AccessLevel.ADMIN, status: UserStatus.ACTIVE, name: "Super Admin" },
    create: { email: adminEmail, name: "Super Admin", role: Role.SUPER_ADMIN, accessLevel: AccessLevel.ADMIN, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash("Admin12345!", 10) },
  });

  const coachEmail = "coach@example.com";
  const coach = await prisma.user.upsert({
    where: { email: coachEmail },
    update: { role: Role.COACH, status: UserStatus.ACTIVE, name: "Coach One" },
    create: { email: coachEmail, name: "Coach One", role: Role.COACH, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash("Coach12345!", 10) },
  });

  const studentEmail = "student@example.com";
  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: { role: Role.STUDENT, status: UserStatus.ACTIVE, name: "Student One" },
    create: { email: studentEmail, name: "Student One", role: Role.STUDENT, status: UserStatus.ACTIVE, passwordHash: await bcrypt.hash("Student12345!", 10) },
  });

  const deck = await prisma.deck.create({ data: { name: "Sample Deck", coachId: coach.id } });
  await prisma.membership.create({ data: { deckId: deck.id, studentId: student.id } });

  await prisma.coachPaymentsConfig.upsert({ where: { coachId: coach.id }, update: {}, create: { coachId: coach.id } });

  console.log({ admin: admin.email, coach: coach.email, student: student.email, deck: deck.name });
}

main().finally(()=>prisma.$disconnect());
