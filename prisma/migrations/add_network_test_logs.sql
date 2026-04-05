-- Migration: Add network_test_logs table
-- Run this against your Supabase production DB

CREATE TABLE IF NOT EXISTS network_test_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  provisioning_url TEXT NOT NULL,
  client_ip VARCHAR(45),
  user_agent TEXT,
  browser_ok BOOLEAN NOT NULL,
  browser_status INT,
  browser_latency_ms INT,
  browser_looks_like_provisioning BOOLEAN NOT NULL DEFAULT FALSE,
  browser_error TEXT,
  server_ok BOOLEAN NOT NULL,
  server_status INT,
  server_latency_ms INT,
  server_looks_like_provisioning BOOLEAN NOT NULL DEFAULT FALSE,
  server_error TEXT,
  outcome VARCHAR(50) NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_test_logs_device_created
  ON network_test_logs (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_test_logs_user_created
  ON network_test_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_network_test_logs_outcome
  ON network_test_logs (outcome);