-- NOTE: change to your own passwords for production environments
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';

-- Vector buckets: the storage service creates its vector store database
-- (`storage_vectors`) on first boot.
ALTER ROLE supabase_storage_admin CREATEDB;

-- Vector tables use pgvector types (vector/halfvec), resolved through the
-- `extensions` schema on the default search_path.
CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
ALTER ROLE supabase_storage_admin SET search_path = storage, extensions;
