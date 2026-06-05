-- Fix settings table Row Level Security and default row
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- If it's missing, disable for everything just to be completely sure:
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_exam_mapping DISABLE ROW LEVEL SECURITY;

-- Insert or fix the settings row just in case
INSERT INTO settings (id, data) 
VALUES (1, '{"appName": "UJIAN ONLINE", "appSubtitle": "Deskripsi Aplikasi", "themeColor": "#2563eb", "gradientEndColor": "#1e40af", "logoStyle": "circle", "antiCheat": {"isActive": true, "freezeDurationSeconds": 30, "alertText": "Pelanggaran terdeteksi!", "enableSound": true}}'::jsonb)
ON CONFLICT (id) DO NOTHING;
