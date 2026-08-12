import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. SYSTEM PERMISSIONS
  const permissions = [
    // Overview
    { key: 'dashboard:view', label: 'View Dashboard & KPIs', module: 'Overview' },
    { key: 'alerts:view', label: 'View Active Alerts', module: 'Overview' },

    // Raw Materials
    { key: 'rm:view', label: 'View Raw Materials', module: 'Raw Materials' },
    { key: 'rm:create', label: 'Create Raw Material', module: 'Raw Materials' },
    { key: 'rm:edit', label: 'Edit Raw Material', module: 'Raw Materials' },
    { key: 'rm:delete', label: 'Delete Raw Material', module: 'Raw Materials' },

    // Finished Goods
    { key: 'fg:view', label: 'View Finished Goods', module: 'Finished Goods' },
    { key: 'fg:create', label: 'Create Finished Good', module: 'Finished Goods' },
    { key: 'fg:edit', label: 'Edit Finished Good', module: 'Finished Goods' },
    { key: 'fg:dispatch', label: 'Dispatch Finished Goods', module: 'Finished Goods' },
    { key: 'fg:delete', label: 'Delete Finished Good', module: 'Finished Goods' },

    // Packaging Materials
    { key: 'pm:view', label: 'View Packaging', module: 'Packaging' },
    { key: 'pm:create', label: 'Create Packaging', module: 'Packaging' },
    { key: 'pm:edit', label: 'Edit Packaging', module: 'Packaging' },
    { key: 'pm:delete', label: 'Delete Packaging', module: 'Packaging' },

    // Operations (GRN / Issues)
    { key: 'grn:create', label: 'Post Goods Receipt Note (GRN)', module: 'Operations' },
    { key: 'issue:create', label: 'Post Material Issue Slip', module: 'Operations' },

    // Purchase Orders & Reports
    { key: 'po:view', label: 'View PO Suggestions', module: 'Operations' },
    { key: 'reports:view', label: 'View Analytics & Reports', module: 'Reports' },

    // User & Role Administration
    { key: 'admin:users', label: 'Manage Staff Users', module: 'Administration' },
    { key: 'admin:roles', label: 'Manage Roles & Permissions', module: 'Administration' },
    { key: 'admin:settings', label: 'Manage System Settings & Lookups', module: 'Administration' },
  ];

  const createdPermsMap: Record<string, string> = {};
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, module: perm.module },
      create: perm,
    });
    createdPermsMap[perm.key] = p.id;
  }

  // 2. DEFAULT ROLES (Discord style color tags)
  const adminRole = await prisma.role.upsert({
    where: { name: 'System Admin' },
    update: { isSystemAdmin: true, colorTag: '#EF4444' },
    create: {
      name: 'System Admin',
      colorTag: '#EF4444',
      description: 'Full access to all modules and user governance',
      isSystemAdmin: true,
      isDefault: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Store Manager' },
    update: { colorTag: '#1D9E75' },
    create: {
      name: 'Store Manager',
      colorTag: '#1D9E75',
      description: 'Operational manager with stock creation, GRN, and issue rights',
      isSystemAdmin: false,
      isDefault: true,
    },
  });

  // Attach all permissions to System Admin Role
  for (const permKey of Object.keys(createdPermsMap)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: createdPermsMap[permKey],
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: createdPermsMap[permKey],
      },
    });
  }

  // 3. ADMIN USER
  const adminPasswordHash = hashPassword('admin123password');
  await prisma.user.upsert({
    where: { email: 'admin@efcpl.com' },
    update: {
      name: 'EFCPL Administrator',
      username: 'admin',
      passwordHash: adminPasswordHash,
      isPasswordSet: true,
      roleId: adminRole.id,
      useDefaultPermissions: true,
    },
    create: {
      email: 'admin@efcpl.com',
      username: 'admin',
      name: 'EFCPL Administrator',
      passwordHash: adminPasswordHash,
      isPasswordSet: true,
      roleId: adminRole.id,
      useDefaultPermissions: true,
    },
  });

  // Demo Manager User
  const managerPasswordHash = hashPassword('manager123');
  await prisma.user.upsert({
    where: { email: 'manager@efcpl.com' },
    update: {
      name: 'Ramesh Patil (Store Manager)',
      username: 'manager',
      passwordHash: managerPasswordHash,
      isPasswordSet: true,
      roleId: managerRole.id,
      useDefaultPermissions: true,
    },
    create: {
      email: 'manager@efcpl.com',
      username: 'manager',
      name: 'Ramesh Patil (Store Manager)',
      passwordHash: managerPasswordHash,
      isPasswordSet: true,
      roleId: managerRole.id,
      useDefaultPermissions: true,
    },
  });

  console.log('✅ Database seeded successfully with Admin User (username: admin, email: admin@efcpl.com)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
