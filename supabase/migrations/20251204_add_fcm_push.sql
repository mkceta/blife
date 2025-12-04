-- Add fcm_token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token text;

-- Create a function to send push notifications via Edge Function
-- Note: This requires the 'push-notification' Edge Function to be deployed
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS trigger AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/push-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
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
