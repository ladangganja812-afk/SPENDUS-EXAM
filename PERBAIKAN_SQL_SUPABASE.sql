-- Salin dan jalankan script SQL ini ke SQL Editor di Supabase Anda untuk memperbaiki masalah penyimpanan:

-- 1. Matikan pembatasan baris (Row Level Security) agar aplikasi bisa menyimpan pengaturan
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- 2. Pastikan tabel lainnya juga dapat diakses
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_mapping DISABLE ROW LEVEL SECURITY;

-- 3. Masukkan konfigurasi standar (jika belum ada)
INSERT INTO settings (id, data) 
VALUES (1, '{"appName": "UJIAN ONLINE", "appSubtitle": "Computer Based Test", "themeColor": "#2459a9", "gradientEndColor": "#60a5fa", "logoStyle": "circle", "schoolLogoUrl": "", "antiCheat": {"isActive": true, "freezeDurationSeconds": 30, "alertText": "Pelanggaran terdeteksi!", "enableSound": true}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Set kebijakan akses tak terbatas (jika RLS tetap dipaksa aktif oleh sistem integrasi)
CREATE POLICY "Allow public access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);
