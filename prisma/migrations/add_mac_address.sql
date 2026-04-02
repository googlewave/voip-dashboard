-- Add MAC address field to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mac_address VARCHAR(17);

-- Create unique index on MAC address (lowercase, no separators stored)
CREATE UNIQUE INDEX IF NOT EXISTS "Device_macAddress_key" ON devices (mac_address);
