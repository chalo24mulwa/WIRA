import { prisma } from "@/lib/prisma";

/**
 * Every admin action that changes an affiliate's status or money (approve,
 * reject, suspend, reactivate, approve/reverse a commission, record a
 * payout) is logged here — required for the audit trail the affiliate
 * program's financial controls depend on.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
