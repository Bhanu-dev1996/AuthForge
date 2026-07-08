import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const userPassword = await bcrypt.hash('User@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@authforge.com' },
    update: {},
    create: {
      email: 'admin@authforge.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: Role.admin,
      emailVerified: new Date(),
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@authforge.com' },
    update: {},
    create: {
      email: 'user@authforge.com',
      name: 'Test User',
      passwordHash: userPassword,
      role: Role.user,
      emailVerified: new Date(),
    },
  });

  console.log('Seed data created:', { admin: admin.email, user: user.email });
  console.log('Admin password: Admin@123');
  console.log('User password: User@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
