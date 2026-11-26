import { orpc } from '../lib/api';
export const siteOptions = orpc.studio.publicSite.queryOptions({ staleTime: 30_000 });
export const ownerOptions = orpc.studio.owner.queryOptions({ retry: false });
export const saveOptions = orpc.studio.save.mutationOptions();
