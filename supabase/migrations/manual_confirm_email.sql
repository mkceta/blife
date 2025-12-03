-- Confirm user email manually
-- Replace 'tu_email@udc.es' with the actual email address
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'tu_email@udc.es';
