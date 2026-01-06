# Old SQL Migration Files

This directory contains old SQL migration files that have been replaced by `COMPLETE_DATABASE_SCHEMA.sql`.

## What to do:

1. **Use `COMPLETE_DATABASE_SCHEMA.sql`** - This is the single, complete schema file that includes everything.

2. **These old files are kept for reference only** - They are no longer needed but kept in case you need to reference them.

3. **If you need to update the database:**
   - Use `COMPLETE_DATABASE_SCHEMA.sql` from the root directory
   - It includes all tables, columns, indexes, and RPC functions
   - It's safe to run multiple times (uses IF NOT EXISTS)

## Files in this directory:

- `add_*.sql` - Old migration files for adding individual columns
- `supabase_*.sql` - Old schema files
- `complete_schema.sql` - Old complete schema (replaced)
- `fix_*.sql` - Old fix scripts
- `check_*.sql` - Old diagnostic scripts

**All of these are now included in `COMPLETE_DATABASE_SCHEMA.sql`**

