import { Prisma } from '@prisma/client';
import { ApiError } from '../common/exceptions/api-error';

/**
 * Attachment / Meta / UrlInfo are polymorphic (ownerType + ownerId, no FK),
 * so the database won't cascade them when an owner row is deleted. Every
 * hard delete has to sweep them by hand or they're left orphaned (an
 * orphaned UrlInfo would also keep squatting on its slug).
 *
 * The Media files behind the attachments are deliberately left alone —
 * Media is a shared library and the same file can be attached elsewhere.
 */
export async function deleteOwnedRows(tx: Prisma.TransactionClient, ownerType: string, ownerIds: string[]) {
  if (ownerIds.length === 0) return;
  const where = { ownerType, ownerId: { in: ownerIds } };
  await tx.attachment.deleteMany({ where });
  await tx.meta.deleteMany({ where });
  await tx.urlInfo.deleteMany({ where });
}

/**
 * A `Restrict` foreign key (P2003) means something we didn't anticipate
 * still points at the row. Surface that as a 409 instead of a raw 500 so
 * the admin sees it stays in Trash for a reason.
 */
export async function runHardDelete<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new ApiError(409, 'Cannot delete permanently: other records still reference this item');
    }
    throw err;
  }
}

export function assertInTrash(item: { deletedAt: Date | null } | null | undefined, label: string) {
  if (!item) throw new ApiError(404, `${label} not found`);
  if (!item.deletedAt) throw new ApiError(409, `${label} must be moved to Trash before it can be deleted permanently`);
}
