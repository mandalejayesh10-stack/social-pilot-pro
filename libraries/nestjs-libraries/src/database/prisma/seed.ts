/**
 * Database seed script — creates initial data for development.
 * Run: pnpm prisma-seed
 *
 * Creates:
 *  - 1 superadmin user
 *  - 1 demo organization
 *  - Subscription plans config
 *  - Sample announcement
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Superadmin user ───────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@socialpilotpro.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail, providerName: 'LOCAL' },
  });

  let admin;
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashed,
        name: 'Admin',
        providerName: 'LOCAL',
        isSuperAdmin: true,
        activated: true,
        timezone: 'UTC',
      },
    });
    console.log(`✅ Created admin user: ${adminEmail}`);
  } else {
    admin = existingAdmin;
    console.log(`⏭️  Admin user already exists: ${adminEmail}`);
  }

  // ── Demo organization ─────────────────────────────────────
  const existingOrg = await prisma.userOrganization.findFirst({
    where: { userId: admin.id },
  });

  if (!existingOrg) {
    const org = await prisma.organization.create({
      data: {
        name: 'Demo Workspace',
        description: 'Default workspace for development',
        timezone: 'UTC',
        users: {
          create: {
            userId: admin.id,
            role: 'ADMIN',
          },
        },
        usageLimits: {
          create: {
            postsLimit: 10,
            accountsLimit: 3,
            reportsLimit: 0,
            aiCreditsLimit: 10,
            teamMembersLimit: 1,
          },
        },
      },
    });
    console.log(`✅ Created demo organization: ${org.name} (${org.id})`);
  } else {
    console.log('⏭️  Demo organization already exists');
  }

  // ── Sample announcement ───────────────────────────────────
  const announcementCount = await prisma.announcement.count();
  if (announcementCount === 0) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to SocialPilot Pro!',
        description: 'Connect your social accounts to start scheduling posts and tracking analytics.',
        color: 'INFO',
      },
    });
    console.log('✅ Created welcome announcement');
  }

  console.log('\n🎉 Seed complete!');
  console.log(`\n📋 Login credentials:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`\n🚀 Start the app: pnpm dev`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
