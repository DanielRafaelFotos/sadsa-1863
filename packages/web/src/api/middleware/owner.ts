import { ORPCError } from '@orpc/server';
import { auth, isOwner } from '../auth';
import { base } from '../__core/app';
export const owner = base.use(async ({ context, next }) => {
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError('UNAUTHORIZED');
  if (!isOwner(session.user)) throw new ORPCError('FORBIDDEN');
  return next({ context: { user: session.user } });
});
