const fs = require('fs');

let content = fs.readFileSync('services/database.ts', 'utf8');

content = content.replace(
    `const { data, error } = await supabase.from('subjects').select('id, name, duration, question_count, token, is_active, education_level, shuffle_questions, shuffle_options, school_access, form_url, questions(id, points)');
    if (error) console.error("Error fetching exams:", error);
    if(!data) return [];`,
    `const data = await fetchAll('subjects', 'id, name, duration, question_count, token, is_active, education_level, shuffle_questions, shuffle_options, school_access, form_url, questions(id, points)');
    if (!data) return [];`
);

content = content.replace(
    `const { data: relData, error: relError } = await supabase.from('results').select('*, students(name), subjects(name)');`,
    `let relData = null, relError = null;
    try {
        relData = await fetchAll('results', '*, students(name), subjects(name)');
    } catch(e) { relError = e; }`
);

content = content.replace(
    `    const { data, error } = await supabase.from('results').select('*');
    if (error) console.error("Error fetching results:", error);
    if (!data) return [];

    const [{ data: students }, { data: subjects }] = await Promise.all([
        supabase.from('students').select('id, name'),
        supabase.from('subjects').select('id, name')
    ]);`,
    `    const data = await fetchAll('results', '*');
    if (!data) return [];

    const [students, subjects] = await Promise.all([
        fetchAll('students', 'id, name'),
        fetchAll('subjects', 'id, name')
    ]);`
);

content = content.replace(
    `    const { data: students, error: studentError } = await supabase.from('students').select('*, student_exam_mapping(id, subject_id, exam_date, session, room)');
    const { data: staff, error: staffError } = await supabase.from('staff').select('*');
    
    if (studentError) console.error("Error fetching students:", studentError);
    if (staffError) console.error("Error fetching staff:", staffError);`,
    `    let students: any[] = [];
    let staff: any[] = [];
    try { students = await fetchAll('students', '*, student_exam_mapping(id, subject_id, exam_date, session, room)'); } catch(e) { console.error("Error fetching students:", e); }
    try { staff = await fetchAll('staff', '*'); } catch(e) { console.error("Error fetching staff:", e); }`
);

content = content.replace(
    `    const { data: students } = await supabase.from('students').select('id, name, school, room, is_login');
    const { data: results } = await supabase.from('results').select('id, exam_id, peserta_id, status');
    return { students: students || [], results: results || [] };`,
    `    const students = await fetchAll('students', 'id, name, school, room, is_login');
    const results = await fetchAll('results', 'id, exam_id, peserta_id, status');
    return { students: students || [], results: results || [] };`
);

content = content.replace(
    `    const { data } = await supabase.from('staff').select('*');
    if(!data) return [];`,
    `    const data = await fetchAll('staff', '*');
    if(!data) return [];`
);

fs.writeFileSync('services/database.ts', content);
console.log("Patched");
