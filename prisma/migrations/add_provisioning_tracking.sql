-- Add provisioning tracking to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_provisioned_at TIMESTAMP;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS provisioning_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS config_version VARCHAR(20);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_seen_ip VARCHAR(45);

-- Create provisioning logs table
CREATE TABLE IF NOT EXISTS provisioning_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'pending'
  config_version VARCHAR(20),
  ip_address VARCHAR(45),
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provisioning_logs_device_id ON provisioning_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_logs_timestamp ON provisioning_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_provisioning_logs_status ON provisioning_logs(status);

-- Create device registration status table
CREATE TABLE IF NOT EXISTS device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL, -- 'registered', 'unregistered', 'failed'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_registrations_device_id ON device_registrations(device_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);

COMMENT ON TABLE provisioning_logs IS 'Tracks all device provisioning attempts for monitoring and debugging';
COMMENT ON TABLE device_registrations IS 'Tracks SIP registration status for devices';
