import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tmis.local' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@tmis.local',
      phone: '+254700000000',
      password: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
  console.log('Default password: Admin@1234');
  console.log('Please change this password immediately after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
