import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { runableManagedAuth } from '@runablehq/managed-auth/server';
import { db } from './database';

export function isOwner(user: { email: string; emailVerified: boolean }) {
  const owner = process.env.STUDIO_OWNER_EMAIL?.toLowerCase().trim();
  return Boolean(owner && user.emailVerified && user.email.toLowerCase().trim() === owner);
}
const configuredOrigin = new URL(process.env.WEBSITE_URL!).origin;
const trusted = [configuredOrigin, ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:4200', 'http://127.0.0.1:4200'])];
function checkOwner(user: { email: string; emailVerified: boolean }) {
  if (!isOwner(user)) throw new APIError('FORBIDDEN', { message: 'Este e-mail não tem acesso ao painel.' });
}
export const auth = betterAuth({
  basePath: '/api/auth',
  baseURL: { allowedHosts: trusted.map((url) => new URL(url).host), fallback: configuredOrigin },
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: trusted,
  databaseHooks: {
    user: { create: { before: async (user) => { checkOwner(user); } } },
  },
  plugins: [...runableManagedAuth({ applicationId: process.env.APPLICATION_ID!, issuer: process.env.VITE_RUNABLE_AUTH_ISSUER! })],
});
