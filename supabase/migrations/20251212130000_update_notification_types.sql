
-- Update notifications table to allow new types for Stripe events
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('system', 'message', 'sale', 'purchase', 'welcome', 'alert', 'info', 'comment'));
