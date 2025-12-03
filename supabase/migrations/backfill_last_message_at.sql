-- Update existing threads to have last_message_at set to created_at if it is null
UPDATE threads 
SET last_message_at = created_at 
WHERE last_message_at IS NULL;
