import { prisma, queryAll, nullIfEmpty } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { toJsonOrWrap } from '../utils';

interface AdminRow {
  id: number;
  type: string; // 'super' | 'admin' — no granular roles in the legacy app
  status: number;
  name: string;
  email: string;
  password: string; // PHP bcrypt ($2y$...) — Node bcrypt verifies $2y$ hashes as-is
}

// Only one role ("Super Admin", all permissions) exists in prisma/seed.ts.
// Legacy type='admin' rows get a new "Admin" role created here with every
// permission except role/user management, so non-super legacy admins can't
// self-escalate post-migration — easy to change from the admin panel if this
// default turns out wrong for a specific person.
async function ensureAdminRole(): Promise<string> {
  const permissions = await prisma.permission.findMany({
    where: { subject: { notIn: ['role', 'user'] } },
  });
  const role = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: { permissions: { connect: permissions.map((p) => ({ id: p.id })) } },
    create: {
      name: 'Admin',
      description: 'Migrated legacy admin — full access except role/user management',
      isSystem: false,
      permissions: { connect: permissions.map((p) => ({ id: p.id })) },
    },
  });
  return role.id;
}

export async function importAdminsAndActivity(): Promise<void> {
  const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Admin' } });
  if (!superAdminRole) throw new Error('Super Admin role missing — run prisma db seed first');
  const adminRoleId = await ensureAdminRole();

  const admins = await queryAll<AdminRow>('SELECT * FROM admins');
  let adminCount = 0;
  for (const row of admins) {
    const [firstName, ...rest] = row.name.trim().split(/\s+/);
    const lastName = rest.join(' ') || null;
    const isSuperAdmin = row.type === 'super';
    try {
      const created = await prisma.user.create({
        data: {
          email: row.email,
          password: row.password,
          firstName: firstName || row.name,
          lastName,
          roleId: isSuperAdmin ? superAdminRole.id : adminRoleId,
          isSuperAdmin,
          isActive: row.status === 1,
        },
      });
      idMap.set('admin', row.id, created.id);
      adminCount++;
    } catch (err) {
      console.warn(`  admins#${row.id} (${row.email}): failed to create, skipped — ${(err as Error).message}`);
    }
  }
  report.record('admins', admins.length, adminCount);

  await importActivityLogs();
}

interface ActivityLogRow {
  id: number;
  logger_id: number;
  logger_type: string;
  primary_action: string | null;
  client_action: string | null;
  action_method: string | null;
  action_data: string | null;
  action_response: string | null;
  action_category: string | null;
  action_category_key: string | null;
  action_title: string;
  action_key: string;
  created_at: Date | null;
}

async function importActivityLogs(): Promise<void> {
  const rows = await queryAll<ActivityLogRow>('SELECT * FROM activity_logs');
  let count = 0;
  for (const row of rows) {
    // logger_type is uniformly 'App\Models\Admin' in this dump — resolve
    // through the admin id-map; fall back to the raw legacy id (stringified,
    // prefixed) if the admin row itself didn't migrate, so the log isn't lost.
    const loggerId = idMap.get('admin', row.logger_id) ?? `legacy-admin-${row.logger_id}`;
    await prisma.activityLog.create({
      data: {
        loggerType: 'admin',
        loggerId,
        primaryAction: nullIfEmpty(row.primary_action),
        clientAction: nullIfEmpty(row.client_action),
        actionMethod: nullIfEmpty(row.action_method),
        actionData: toJsonOrWrap(row.action_data) as never,
        actionResponse: toJsonOrWrap(row.action_response) as never,
        actionCategory: nullIfEmpty(row.action_category),
        actionCategoryKey: nullIfEmpty(row.action_category_key),
        actionTitle: nullIfEmpty(row.action_title),
        actionKey: nullIfEmpty(row.action_key),
        createdAt: row.created_at ?? new Date(),
      },
    });
    count++;
  }
  report.record('activity_logs', rows.length, count);
}
