// prisma/seed.ts
import 'dotenv/config'; // ← add this as the first line
import { PrismaClient, type Permission, type Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

// ══════════════════════════════════════════════════════════════════════════════
// CLIENT
// ══════════════════════════════════════════════════════════════════════════════

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const BCRYPT_COST = 12;

// ══════════════════════════════════════════════════════════════════════════════
// PERMISSIONS DATA
// ══════════════════════════════════════════════════════════════════════════════

const permissionsData = [
  // User
  { action: 'create', subject: 'user', name: 'create:user' },
  { action: 'read', subject: 'user', name: 'read:user' },
  { action: 'update', subject: 'user', name: 'update:user' },
  { action: 'delete', subject: 'user', name: 'delete:user' },

  // Role
  { action: 'create', subject: 'role', name: 'create:role' },
  { action: 'read', subject: 'role', name: 'read:role' },
  { action: 'update', subject: 'role', name: 'update:role' },
  { action: 'delete', subject: 'role', name: 'delete:role' },

  // Page
  { action: 'create', subject: 'page', name: 'create:page' },
  { action: 'read', subject: 'page', name: 'read:page' },
  { action: 'update', subject: 'page', name: 'update:page' },
  { action: 'delete', subject: 'page', name: 'delete:page' },

  // Media
  { action: 'create', subject: 'media', name: 'create:media' },
  { action: 'read', subject: 'media', name: 'read:media' },
  { action: 'update', subject: 'media', name: 'update:media' },
  { action: 'delete', subject: 'media', name: 'delete:media' },

  // Analytics (read-only)
  { action: 'read', subject: 'analytics', name: 'read:analytics' },

  // Category (also covers /category-types — same permission subject)
  { action: 'create', subject: 'category', name: 'create:category' },
  { action: 'read', subject: 'category', name: 'read:category' },
  { action: 'update', subject: 'category', name: 'update:category' },
  { action: 'delete', subject: 'category', name: 'delete:category' },

  // Tag
  { action: 'create', subject: 'tag', name: 'create:tag' },
  { action: 'read', subject: 'tag', name: 'read:tag' },
  { action: 'update', subject: 'tag', name: 'update:tag' },
  { action: 'delete', subject: 'tag', name: 'delete:tag' },

  // Blog (also covers /blog-authors — same permission subject)
  { action: 'create', subject: 'blog', name: 'create:blog' },
  { action: 'read', subject: 'blog', name: 'read:blog' },
  { action: 'update', subject: 'blog', name: 'update:blog' },
  { action: 'delete', subject: 'blog', name: 'delete:blog' },

  // Comment (moderation only — submission is public, unauthenticated)
  { action: 'read', subject: 'comment', name: 'read:comment' },
  { action: 'update', subject: 'comment', name: 'update:comment' },
  { action: 'delete', subject: 'comment', name: 'delete:comment' },

  // FAQ (also covers /group-faqs — same permission subject)
  { action: 'create', subject: 'faq', name: 'create:faq' },
  { action: 'read', subject: 'faq', name: 'read:faq' },
  { action: 'update', subject: 'faq', name: 'update:faq' },
  { action: 'delete', subject: 'faq', name: 'delete:faq' },

  // Testimonial
  { action: 'create', subject: 'testimonial', name: 'create:testimonial' },
  { action: 'read', subject: 'testimonial', name: 'read:testimonial' },
  { action: 'update', subject: 'testimonial', name: 'update:testimonial' },
  { action: 'delete', subject: 'testimonial', name: 'delete:testimonial' },

  // Place
  { action: 'create', subject: 'place', name: 'create:place' },
  { action: 'read', subject: 'place', name: 'read:place' },
  { action: 'update', subject: 'place', name: 'update:place' },
  { action: 'delete', subject: 'place', name: 'delete:place' },

  // Gallery Album (the site-wide, destination-categorized photo gallery —
  // distinct from the per-entity GALLERY attachments Place/Package/Itinerary
  // already have)
  { action: 'create', subject: 'gallery', name: 'create:gallery' },
  { action: 'read', subject: 'gallery', name: 'read:gallery' },
  { action: 'update', subject: 'gallery', name: 'update:gallery' },
  { action: 'delete', subject: 'gallery', name: 'delete:gallery' },

  // Team
  { action: 'create', subject: 'team', name: 'create:team' },
  { action: 'read', subject: 'team', name: 'read:team' },
  { action: 'update', subject: 'team', name: 'update:team' },
  { action: 'delete', subject: 'team', name: 'delete:team' },

  // Company Document (the /company-documents "Legal Documents" grid)
  { action: 'create', subject: 'document', name: 'create:document' },
  { action: 'read', subject: 'document', name: 'read:document' },
  { action: 'update', subject: 'document', name: 'update:document' },
  { action: 'delete', subject: 'document', name: 'delete:document' },

  // Homepage Services
  { action: 'create', subject: 'service', name: 'create:service' },
  { action: 'read', subject: 'service', name: 'read:service' },
  { action: 'update', subject: 'service', name: 'update:service' },
  { action: 'delete', subject: 'service', name: 'delete:service' },

  // Travel (covers TripInfo, StoryAuthor, Story, Package, Departure, Itinerary
  // — one subject, mirrors how the legacy admin grouped this whole section)
  { action: 'create', subject: 'travel', name: 'create:travel' },
  { action: 'read', subject: 'travel', name: 'read:travel' },
  { action: 'update', subject: 'travel', name: 'update:travel' },
  { action: 'delete', subject: 'travel', name: 'delete:travel' },

  // Booking (covers Booking + CustomBooking — invoice creation uses create:booking)
  { action: 'read', subject: 'booking', name: 'read:booking' },
  { action: 'create', subject: 'booking', name: 'create:booking' },
  { action: 'delete', subject: 'booking', name: 'delete:booking' },

  // Payment (admin record-keeping — see payment.service.ts)
  { action: 'create', subject: 'payment', name: 'create:payment' },
  { action: 'read', subject: 'payment', name: 'read:payment' },
  { action: 'update', subject: 'payment', name: 'update:payment' },
  { action: 'delete', subject: 'payment', name: 'delete:payment' },

  // Menu (covers MenuType + MenuItem)
  { action: 'create', subject: 'menu', name: 'create:menu' },
  { action: 'read', subject: 'menu', name: 'read:menu' },
  { action: 'update', subject: 'menu', name: 'update:menu' },
  { action: 'delete', subject: 'menu', name: 'delete:menu' },

  // Settings (covers GlobalCategory + GlobalSetting)
  { action: 'create', subject: 'settings', name: 'create:settings' },
  { action: 'read', subject: 'settings', name: 'read:settings' },
  { action: 'update', subject: 'settings', name: 'update:settings' },
  { action: 'delete', subject: 'settings', name: 'delete:settings' },

  // Redirect
  { action: 'create', subject: 'redirect', name: 'create:redirect' },
  { action: 'read', subject: 'redirect', name: 'read:redirect' },
  { action: 'update', subject: 'redirect', name: 'update:redirect' },
  { action: 'delete', subject: 'redirect', name: 'delete:redirect' },

  // Activity log (read-only — see activity-log.routes.ts)
  { action: 'read', subject: 'activity-log', name: 'read:activity-log' },

  // Contact messages (submission is public, unauthenticated)
  { action: 'read', subject: 'contact', name: 'read:contact' },
  { action: 'update', subject: 'contact', name: 'update:contact' },
  { action: 'delete', subject: 'contact', name: 'delete:contact' },
];

// ══════════════════════════════════════════════════════════════════════════════
// SEED STEPS
// ══════════════════════════════════════════════════════════════════════════════

async function seedPermissions(): Promise<Permission[]> {
  const permissions: Permission[] = [];

  for (const p of permissionsData) {
    // Keyed on (action, subject) rather than name — that pair has its own unique
    // constraint, and earlier seed runs may have created the same action/subject
    // under a different name. Upserting by name alone would collide with that row.
    const permission = await prisma.permission.upsert({
      where: { action_subject: { action: p.action, subject: p.subject } },
      update: { name: p.name },
      create: p,
    });
    permissions.push(permission);
  }

  console.log(`✅ ${permissions.length} permissions created/verified`);
  return permissions;
}

async function seedSuperAdminRole(permissions: Permission[]): Promise<Role> {
  const permissionLinks = permissions.map((p) => ({ id: p.id }));

  const role = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {
      permissions: { connect: permissionLinks },
    },
    create: {
      name: 'Super Admin',
      description: 'Full system access',
      isSystem: true,
      permissions: { connect: permissionLinks },
    },
  });

  console.log(`✅ Role created: ${role.name}`);
  return role;
}

async function seedSuperAdminUser(roleId: string) {
  const hashedPassword = await bcrypt.hash('SuperAdmin@1234', BCRYPT_COST);

  const user = await prisma.user.upsert({
    where: { email: 'superadmin@boundless.local' },
    update: { roleId, isSuperAdmin: true, isActive: true },
    create: {
      email: 'superadmin@boundless.local',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId,
      isSuperAdmin: true,
      isActive: true,
    },
  });

  console.log(`✅ SuperAdmin created: ${user.email}`);
  return user;
}

async function seedHomepageServices() {
  await prisma.serviceSectionConfig.upsert({
    where: { id: 'homepage-services' },
    update: {},
    create: {
      id: 'homepage-services',
      eyebrow: 'Services',
      heading: 'Everything We Take Care of',
      introduction:
        'From the first email to the final descent, every part of your journey is planned, permitted, and personally guided.',
    },
  });

  await prisma.service.upsert({
    where: { id: 'service-adventure-tourism' },
    update: {},
    create: {
      id: 'service-adventure-tourism',
      title: 'Adventure Tourism',
      description:
        'Spectacular trekking experiences to iconic destinations like Everest Base Camp and Annapurna Circuit, as well as off-the-beaten-path adventures. Expert guides, top-notch equipment, and meticulous planning ensure unforgettable and safe hiking experiences in the Himalayas.',
      secondaryDescription:
        'Spectacular trekking experiences to iconic destinations like Everest Base Camp and Annapurna Circuit, as well as off-the-beaten-path adventures. Expert guides, top-notch equipment, and meticulous planning ensure unforgettable and safe hiking experiences in the Himalayas.',
      imageUrl: '/images/services/adventure-tourism.jpg',
      ctaLabel: 'Know More',
      ctaUrl: '/about-us',
      sortOrder: 1,
      isActive: true,
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🚀 Starting database seed...\n');

  await prisma.$connect();

  const permissions = await seedPermissions();
  const superAdminRole = await seedSuperAdminRole(permissions);
  await seedSuperAdminUser(superAdminRole.id);
  await seedHomepageServices();

  console.log('\n--- Login Credentials ---');
  console.log('SuperAdmin → superadmin@boundless.local / SuperAdmin@1234');
  console.log('');
}

main()
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
