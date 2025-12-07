-- Enable the pg_net extension
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- Add fcm_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token text;

-- Create a function to send push notifications via Edge Function
-- Note: This requires the 'push-notification' Edge Function to be deployed
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS trigger AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://ixcjzqipexsawgpinjli.supabase.co/functions/v1/push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Y2p6cWlwZXhzYXdncGluamxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDg2MDQsImV4cCI6MjA3OTM4NDYwNH0.c0toeYu_ZT5L5GROKZpJp7g6pbvB7MFQKoY20dDRGJc"}'::jsonb,
      body := jsonb_build_object(
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on new notification
DROP TRIGGER IF EXISTS on_new_notification_push ON notifications;
CREATE TRIGGER on_new_notification_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_notification();
