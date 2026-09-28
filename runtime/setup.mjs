import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { executeScript, literal } from './db.mjs';

const email=String(process.env.PROVISION_ADMIN_EMAIL||process.env.ADMIN_EMAIL||'').trim().toLowerCase();
const password=String(process.env.PROVISION_ADMIN_PASSWORD||process.env.ADMIN_PASSWORD||'');
if(!email||password.length<12)throw new Error('Runtime administrator credentials are required');
const salt=crypto.randomBytes(16).toString('hex');
const hash='scrypt$'+salt+'$'+crypto.scryptSync(password,salt,32).toString('hex');
executeScript(`
  BEGIN;
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS runtime_app_users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS runtime_app_sessions(
    token_hash TEXT PRIMARY KEY,user_id UUID NOT NULL REFERENCES runtime_app_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS runtime_ai_interactions(
    id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES runtime_app_users(id),feature TEXT NOT NULL,
    input JSONB NOT NULL,output JSONB NOT NULL,model TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS runtime_ai_interactions_user_idx ON runtime_ai_interactions(user_id,created_at DESC);
  INSERT INTO runtime_app_users(email,password_hash,display_name,role,active)
  VALUES(${literal(email)},${literal(hash)},'Runtime Administrator','admin',TRUE)
  ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='admin',active=TRUE;
  COMMIT;
`);

if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'false') {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { password: passwordHash, name: 'Runtime Administrator', role: 'ADMIN', emailVerified: true },
      create: { email, password: passwordHash, name: 'Runtime Administrator', role: 'ADMIN', emailVerified: true },
    });
  } finally {
    await prisma.$disconnect();
  }
}
console.log('Runtime identity and AI persistence reconciled.');
