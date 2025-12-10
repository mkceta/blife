-- Create user_devices table for FCM tokens (1 user can have multiple devices)
CREATE TABLE IF NOT EXISTS user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fcm_token text NOT NULL UNIQUE,
  platform text CHECK (platform IN ('android', 'ios', 'web')),
  device_name text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, fcm_token)
);

-- Index for faster lookups
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_token ON user_devices(fcm_token);

-- RLS Policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" 
  ON user_devices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" 
  ON user_devices FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" 
  ON user_devices FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" 
  ON user_devices FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to clean up old/inactive devices (optional, run periodically)
CREATE OR REPLACE FUNCTION cleanup_inactive_devices()
RETURNS void AS $$
BEGIN
  DELETE FROM user_devices 
  WHERE last_active < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
