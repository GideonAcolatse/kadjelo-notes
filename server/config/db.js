import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config();

let sqlClient = null;
let isInitialized = false;

export function getSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes('ep-cool-darkness-123456')) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

export async function initializeDatabase() {
  const sql = getSql();
  if (!sql) {
    return {
      connected: false,
      mode: 'local-first',
      message: 'DATABASE_URL not configured yet — running in Local-First Offline Mode'
    };
  }

  try {
    if (!isInitialized) {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(120) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS notes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT DEFAULT '',
          category VARCHAR(64) DEFAULT 'Personal',
          status VARCHAR(32) DEFAULT 'todo',
          tags JSONB DEFAULT '[]'::jsonb,
          checklist JSONB DEFAULT '[]'::jsonb,
          attachments JSONB DEFAULT '[]'::jsonb,
          flashcards JSONB DEFAULT '[]'::jsonb,
          focus_minutes INTEGER DEFAULT 0,
          color VARCHAR(32) DEFAULT 'default',
          is_pinned BOOLEAN DEFAULT FALSE,
          is_archived BOOLEAN DEFAULT FALSE,
          is_trashed BOOLEAN DEFAULT FALSE,
          is_locked BOOLEAN DEFAULT FALSE,
          lock_pin_hash TEXT DEFAULT NULL,
          biometric_enabled BOOLEAN DEFAULT FALSE,
          reminder_at TIMESTAMPTZ DEFAULT NULL,
          version_history JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_notes_lookup ON notes(user_id, is_trashed, is_archived, is_pinned)
      `;
      isInitialized = true;
    }

    await sql`SELECT 1`;
    return {
      connected: true,
      mode: 'neon-cloud',
      message: 'Connected to Neon Serverless PostgreSQL'
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'local-first',
      message: `Neon DB connection warning: ${err.message}`
    };
  }
}
