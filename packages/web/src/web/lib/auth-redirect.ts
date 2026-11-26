import { authClient } from './auth';
try { await authClient.managedAuth.handleRedirect(); } catch { /* The panel can retry sign-in. */ }
