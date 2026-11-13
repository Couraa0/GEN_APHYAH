-- Aplikasi ini tidak memakai Data API Supabase (PostgREST): semua akses lewat backend.
-- Supabase memberi peran API (anon, authenticated, service_role) izin ke setiap tabel di
-- schema public secara bawaan. Izin itu dicabut di sini, termasuk untuk tabel yang dibuat
-- nanti, sehingga tabel baru yang lupa diberi RLS pun tidak terbuka lewat Data API.
-- Di PostgreSQL biasa (lokal, tes) peran-peran itu tidak ada, jadi blok ini tidak berbuat apa-apa.
DO $$
DECLARE
  api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM %I', api_role);
    END IF;
  END LOOP;
END $$;
