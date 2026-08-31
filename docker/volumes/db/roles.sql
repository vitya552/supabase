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

-- Vector tables live in the `storage_vectors` database (created by the
-- storage service on first boot) and use pgvector types (vector/halfvec).
-- Installing the extension into template1 makes it available there.
\c template1
CREATE EXTENSION IF NOT EXISTS vector;
\c postgres
