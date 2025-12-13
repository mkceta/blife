
-- Update notifications table to allow new types for Stripe events AND reactions/favorites
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('system', 'message', 'sale', 'purchase', 'welcome', 'alert', 'info', 'comment', 'reaction', 'favorite', 'listing_sold'));
