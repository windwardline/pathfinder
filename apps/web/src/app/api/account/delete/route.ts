import { db, users } from '@pathfinder/core';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { accountDeletionSchema } from '@/lib/validation';
import { apiError, apiSuccess, correlationId } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordAuditEvent } from '@/lib/audit';

/** Hard-deletes the account aggregate; foreign-key cascades revoke sessions and user data. */
export async function POST(request: Request) {
  const correlation = correlationId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return apiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
      correlationId: correlation,
    });
  }
  const userId = session.user.id;

  if (!(await checkRateLimit(`delete-account:${userId}`, 3, 60 * 60_000))) {
    return apiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Please wait before trying account deletion again.',
      retryable: true,
      correlationId: correlation,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const parsed = accountDeletionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError({
      status: 400,
      code: 'CONFIRMATION_REQUIRED',
      message: 'Type DELETE MY ACCOUNT exactly to confirm deletion.',
      correlationId: correlation,
    });
  }

  try {
    await db.transaction(async tx => {
      const [deleted] = await tx
        .delete(users)
        .where(eq(users.id, userId))
        .returning({ id: users.id });
      if (!deleted) throw new Error('Account was not found.');
      // Audit records intentionally have no user foreign key so the minimum
      // categorical deletion receipt survives without account content.
      await recordAuditEvent(
        {
          actorId: userId,
          eventType: 'ACCOUNT_DELETION_COMPLETED',
          resourceType: 'ACCOUNT',
          resourceId: userId,
          correlationId: correlation,
          metadata: { outcome: 'HARD_DELETE' },
        },
        tx
      );
    });
    return apiSuccess(
      { status: 'DELETED', completion_status: 'COMPLETE' },
      request,
      200,
      correlation
    );
  } catch (error) {
    console.error('POST /api/account/delete failed:', error);
    return apiError({
      status: 500,
      code: 'DELETION_FAILED',
      message: 'Account deletion could not be completed. Your account is unchanged.',
      retryable: true,
      correlationId: correlation,
    });
  }
}
