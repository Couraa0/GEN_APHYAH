-- Supabase mengekspos schema "public" lewat Data API (PostgREST). Aplikasi ini hanya mengakses
-- database lewat backend, yang terhubung sebagai pemilik tabel dan karena itu tidak terkena RLS.
-- RLS aktif tanpa policy = peran "anon" dan "authenticated" tidak bisa membaca atau menulis
-- apa pun lewat Data API, termasuk hash password di "users".
-- Tabel baru di migrasi berikutnya harus ikut diberi ENABLE ROW LEVEL SECURITY.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "households" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collection_points" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waste_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "collection_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weighing_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pickup_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "buyers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketplace_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organic_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organic_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "plastic_experiments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
