CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agency_staff', -- 'admin' | 'agency_staff'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  youtube_channel_id TEXT NOT NULL,
  handle TEXT,
  oauth_connected BOOLEAN DEFAULT false, -- true once Phase 2 OAuth is linked
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id),
  date DATE NOT NULL,              -- required for daily-granularity charts (Phase 2)
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  subscribers BIGINT,
  watch_time_minutes BIGINT,       -- Phase 2 (Analytics API only)
  source TEXT NOT NULL,            -- 'data_api_v3' | 'analytics_api'
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, date, source)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
