import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting database seed for updated EFCPL MES system...');

  // 1. GRANULAR PERMISSIONS (Discord-style)
  const permissions = [
    // Inventory Section
    { key: 'inventory:rm:view', label: 'View Raw Materials', module: 'Inventory', action: 'view' },
    { key: 'inventory:rm:create', label: 'Create Raw Material', module: 'Inventory', action: 'create' },
    { key: 'inventory:rm:edit', label: 'Edit Raw Material', module: 'Inventory', action: 'edit' },
    { key: 'inventory:rm:delete', label: 'Delete Raw Material', module: 'Inventory', action: 'delete' },

    { key: 'inventory:pm:view', label: 'View Packaging Materials', module: 'Inventory', action: 'view' },
    { key: 'inventory:pm:create', label: 'Create Packaging Material', module: 'Inventory', action: 'create' },
    { key: 'inventory:pm:edit', label: 'Edit Packaging Material', module: 'Inventory', action: 'edit' },
    { key: 'inventory:pm:delete', label: 'Delete Packaging Material', module: 'Inventory', action: 'delete' },

    // Operations Section (5 Dedicated Tabs)
    { key: 'operations:rm_issue:view', label: 'View RM Issues', module: 'Operations', action: 'view' },
    { key: 'operations:rm_issue:create', label: 'Create RM Issue', module: 'Operations', action: 'create' },
    { key: 'operations:rm_issue:delete', label: 'Delete RM Issue', module: 'Operations', action: 'delete' },

    { key: 'operations:production:view', label: 'View Production Logs', module: 'Operations', action: 'view' },
    { key: 'operations:production:create', label: 'Record Production Log', module: 'Operations', action: 'create' },
    { key: 'operations:production:delete', label: 'Delete Production Log', module: 'Operations', action: 'delete' },

    { key: 'operations:pm_issue:view', label: 'View Packaging Issues', module: 'Operations', action: 'view' },
    { key: 'operations:pm_issue:create', label: 'Create Packaging Issue', module: 'Operations', action: 'create' },
    { key: 'operations:pm_issue:delete', label: 'Delete Packaging Issue', module: 'Operations', action: 'delete' },

    { key: 'operations:fg:view', label: 'View Finished Goods', module: 'Operations', action: 'view' },
    { key: 'operations:fg:create', label: 'Create Finished Good', module: 'Operations', action: 'create' },
    { key: 'operations:fg:edit', label: 'Edit Finished Good', module: 'Operations', action: 'edit' },
    { key: 'operations:fg:delete', label: 'Delete Finished Good', module: 'Operations', action: 'delete' },

    { key: 'operations:dispatch:view', label: 'View Dispatches', module: 'Operations', action: 'view' },
    { key: 'operations:dispatch:create', label: 'Create Dispatch', module: 'Operations', action: 'create' },
    { key: 'operations:dispatch:delete', label: 'Delete Dispatch', module: 'Operations', action: 'delete' },

    // Master Add Materials Section
    { key: 'master:add_materials:access', label: 'Access Add Materials Hub', module: 'Add Materials', action: 'create' },

    // Lab Tests
    { key: 'lab:coa:view', label: 'View COA Certificates', module: 'Lab Tests', action: 'view' },
    { key: 'lab:coa:create', label: 'Upload COA Certificate', module: 'Lab Tests', action: 'create' },
    { key: 'lab:coa:delete', label: 'Delete COA Certificate', module: 'Lab Tests', action: 'delete' },

    // Admin Governance
    { key: 'admin:roles:manage', label: 'Manage Discord Roles & Permissions', module: 'Administration', action: 'edit' },
    { key: 'admin:users:manage', label: 'Manage Staff Users', module: 'Administration', action: 'edit' },
    { key: 'admin:lookups:manage', label: 'Manage System Lookups', module: 'Administration', action: 'edit' },
  ];

  const createdPermsMap: Record<string, string> = {};
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, module: perm.module, action: perm.action },
      create: perm,
    });
    createdPermsMap[perm.key] = p.id;
  }

  // 2. DISCORD STYLE ROLES
  const adminRole = await prisma.role.upsert({
    where: { name: 'System Admin' },
    update: { isSystemAdmin: true, colorTag: '#EF4444' },
    create: {
      name: 'System Admin',
      colorTag: '#EF4444',
      description: 'Full administrative access across all modules, roles, and users',
      isSystemAdmin: true,
    },
  });

  const storeManagerRole = await prisma.role.upsert({
    where: { name: 'Store Manager' },
    update: { colorTag: '#10B981' },
    create: {
      name: 'Store Manager',
      colorTag: '#10B981',
      description: 'Manages Raw Materials, Packaging Materials, and Issuances',
      isSystemAdmin: false,
    },
  });

  const labTesterRole = await prisma.role.upsert({
    where: { name: 'Lab Tester' },
    update: {},
    create: {
      name: 'Lab Tester',
      colorTag: '#A855F7',
      description: 'Runs product testing and uploads batch-wise Certificates of Analysis',
    },
  });

  // Lab Testers get the COA permissions plus read access to finished goods
  for (const key of ['lab:coa:view', 'lab:coa:create', 'lab:coa:delete', 'operations:fg:view']) {
    if (!createdPermsMap[key]) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: labTesterRole.id, permissionId: createdPermsMap[key] },
      },
      update: {},
      create: { roleId: labTesterRole.id, permissionId: createdPermsMap[key] },
    });
  }

  const productionSupervisorRole = await prisma.role.upsert({
    where: { name: 'Production Supervisor' },
    update: { colorTag: '#F59E0B' },
    create: {
      name: 'Production Supervisor',
      colorTag: '#F59E0B',
      description: 'Manages Production runs, Batch outputs, and Finished Goods',
      isSystemAdmin: false,
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

  // 3. SEED INITIAL DEMO USERS
  const adminPassword = hashPassword('admin123');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      name: 'Executive Admin',
      passwordHash: adminPassword,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      username: 'admin',
      name: 'Executive Admin',
      passwordHash: adminPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const managerPassword = hashPassword('manager123');
  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {
      name: 'Suresh Patil (Store Manager)',
      passwordHash: managerPassword,
      roleId: storeManagerRole.id,
      isActive: true,
    },
    create: {
      username: 'manager',
      name: 'Suresh Patil (Store Manager)',
      passwordHash: managerPassword,
      roleId: storeManagerRole.id,
      isActive: true,
    },
  });

  // 4. SAMPLE SEED DATA FOR INVENTORY & OPERATIONS
  console.log('📦 Seeding sample Raw Materials Master & Arrivals...');
  // Master definitions
  const masterRm1 = await prisma.rawMaterial.findFirst({ where: { code: 'RM001', isMaster: true } });
  if (!masterRm1) {
    await prisma.rawMaterial.create({
      data: {
        code: 'RM001',
        name: 'Refined Sugar (Grade A)',
        brand: 'Madhur Pure',
        batchNumber: '',
        stock: 0,
        unit: 'KG',
        reorderLevel: 1000,
        maxStock: 10000,
        supplier: 'Sahakar Sugar Mills',
        location: 'Cold Room Zone A',
        isMaster: true,
        status: 'Active',
      },
    });
  }

  const masterRm2 = await prisma.rawMaterial.findFirst({ where: { code: 'RM002', isMaster: true } });
  if (!masterRm2) {
    await prisma.rawMaterial.create({
      data: {
        code: 'RM002',
        name: 'Mango Pulp Puree',
        brand: 'Alphonso Premium',
        batchNumber: '',
        stock: 0,
        unit: 'LTR',
        reorderLevel: 500,
        maxStock: 5000,
        supplier: 'Konkan Agro Tech',
        location: 'Deep Freeze -18°C',
        isMaster: true,
        status: 'Active',
      },
    });
  }

  // Sample Logged Arrivals
  const rm1 = await prisma.rawMaterial.findFirst({ where: { code: 'RM001', isMaster: false } });
  if (!rm1) {
    await prisma.rawMaterial.create({
      data: {
        code: 'RM001',
        name: 'Refined Sugar (Grade A)',
        brand: 'Madhur Pure',
        batchNumber: 'B-SUG-2026-01',
        stock: 4500,
        unit: 'KG',
        reorderLevel: 1000,
        maxStock: 10000,
        supplier: 'Sahakar Sugar Mills',
        location: 'Cold Room Zone A',
        expiryDate: new Date('2027-08-30'),
        status: 'Active',
        isMaster: false,
      },
    });
  }

  const rm2 = await prisma.rawMaterial.findFirst({ where: { code: 'RM002', isMaster: false } });
  if (!rm2) {
    await prisma.rawMaterial.create({
      data: {
        code: 'RM002',
        name: 'Mango Pulp Puree',
        brand: 'Alphonso Premium',
        batchNumber: 'B-MNG-2026-04',
        stock: 1200,
        unit: 'LTR',
        reorderLevel: 500,
        maxStock: 5000,
        supplier: 'Konkan Agro Tech',
        location: 'Deep Freeze -18°C',
        expiryDate: new Date('2026-12-15'),
        status: 'Active',
        isMaster: false,
      },
    });
  }

  console.log('📦 Seeding sample Packaging Materials...');
  await prisma.packagingMaterial.upsert({
    where: { code: 'PM001' },
    update: {},
    create: {
      code: 'PM001',
      name: '500ml Glass Jar Bottles',
      brand: 'Hindusthan Glass',
      batchNumber: 'P-BOT-2026-99',
      stock: 25000,
      unit: 'Units',
      reorderLevel: 5000,
      maxStock: 50000,
      supplier: 'Hindusthan National Glass',
      location: 'Warehouse Bay B2',
      expiryDate: new Date('2030-01-01'),
      status: 'Active',
    },
  });

  console.log('📦 Seeding sample Finished Goods...');
  const mfg = new Date('2026-08-01');
  const exp = new Date('2027-08-01');
  const shelfDays = Math.round((exp.getTime() - mfg.getTime()) / (1000 * 3600 * 24));

  await prisma.finishedGood.upsert({
    where: { sku: 'FGPRO001' },
    update: {},
    create: {
      sku: 'FGPRO001',
      name: 'Premium Mango Jam 500g Jar',
      batchNumber: 'FG-MNG-8801',
      quantityProduced: 2000,
      totalStock: 1800,
      unit: 'Jars',
      mfgDate: mfg,
      expiryDate: exp,
      shelfLifeDays: shelfDays,
      location: 'Cold Store Zone B',
      status: 'In Stock',
    },
  });

  console.log('🎉 Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
