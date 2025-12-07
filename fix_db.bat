@echo off
echo Fixing database migration history...
call npx supabase migration repair --status reverted 20251204
call npx supabase migration repair --status reverted 20251206
echo Applying new migrations...
call npx supabase db push
echo Done!
pause
