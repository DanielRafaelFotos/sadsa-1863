import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { base } from '../__core/app';
import { db } from '../database';
import { studioSite } from '../database/schema';
import { owner } from '../middleware/owner';
import { initialStudio, studioSchema } from '../../shared/studio';

const mime = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' } as const;
export const studio = {
  publicSite: base.handler(async () => {
    const [record] = await db.select({ content: studioSite.content }).from(studioSite).where(eq(studioSite.id, 'main'));
    return record?.content ?? initialStudio;
  }),
  owner: owner.handler(({ context }) => ({ email: context.user.email })),
  save: owner.input(studioSchema).handler(async ({ input }) => {
    await db.insert(studioSite).values({ id: 'main', content: input }).onConflictDoUpdate({ target: studioSite.id, set: { content: input } });
    return { saved: true };
  }),
  presign: owner.input(z.object({ type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']), size: z.number().int().min(1).max(15_000_000) })).handler(async ({ input }) => {
    const s3 = new S3Client({ region: 'auto', endpoint: process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });
    const bucket = process.env.S3_BUCKET!;
    const key = `portfolio/${crypto.randomUUID()}.${mime[input.type]}`;
    const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: input.type, ACL: 'public-read', ContentLength: input.size }), { expiresIn: 300, signableHeaders: new Set(['x-amz-acl', 'content-type', 'content-length']) });
    return { url, publicUrl: `https://${bucket}.t3.tigrisfiles.io/${key}` };
  }),
};
