import { supabase, isSupabaseConfigured } from './supabase';
import { User, UserRole, Exam, Question, ExamResult, AppSettings } from '../types';

async function fetchAll(table: string, selectQuery: string = '*') {
    if (!isSupabaseConfigured) return [];
    let allData: any[] = [];
    let from = 0;
    const step = 999;
    
    while (true) {
        const { data, error } = await supabase.from(table).select(selectQuery).range(from, from + step);
        if (error) {
            console.error(`Error fetchAll on table ${table}:`, error);
            throw error;
        }
        if (!data || data.length === 0) break;
        
        allData = allData.concat(data);
        if (data.length <= step) break;
        from += step + 1;
    }
    return allData;
}

// Supabase wrapper
export const db = {
  getSettings: async (): Promise<AppSettings> => {
    const defaultSettings: AppSettings = {
      appName: 'UJIAN ONLINE',
      appSubtitle: 'Computer Based Test',
      logoStyle: 'circle',
      themeColor: '#2563eb',
      gradientEndColor: '#60a5fa',
      schoolLogoUrl: '',
      ministryLogoUrl: '',
      footerText: '',
      showTokenToStudents: false,
      antiCheat: { isActive: true, freezeDurationSeconds: 15, alertText: 'Pelanggaran!', enableSound: true, antiSubmitEnabled: false, antiSubmitTime: 10 }
    };

    if (!isSupabaseConfigured) return defaultSettings;

    try {
        const { data, error } = await supabase.from('settings').select('data').eq('id', 1).single();
        if (error && error.code !== 'PGRST116') {
            console.warn("Supabase settings error:", error);
            // Don't throw, just fallback so app doesn't crash
            return defaultSettings;
        }
        if (data && data.data) {
            return {
                ...defaultSettings,
                ...data.data,
                antiCheat: {
                    ...defaultSettings.antiCheat,
                    ...(data.data.antiCheat || {})
                }
            } as AppSettings;
        }
    } catch (e) {
        console.error("Failed to fetch settings from DB", e);
    }
    return defaultSettings;
  },
  updateSettings: async (newSettings: Partial<AppSettings>): Promise<void> => {
    let current = await db.getSettings();
    let merged = { ...current, ...newSettings };
    const { error } = await supabase.from('settings').upsert({ id: 1, data: merged });
    if (error) {
        console.error("Failed to update settings in DB:", error);
        throw error;
    }
  },
  login: async (input: string, password?: string): Promise<User | undefined> => {
    const cleanInput = input.trim();
    const cleanInputLower = cleanInput.toLowerCase();
    const cleanPassword = (password || '').trim();
    
    // Check if Supabase is properly configured first
    if (!isSupabaseConfigured) {
        throw new Error("Koneksi Error: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diatur. Silakan atur Environment Variables.");
    }

    try {
        // Try staff first
        let { data: staffData, error: staffError } = await supabase.from('staff').select('*').ilike('username', `%${cleanInput}%`);
        if (staffError) {
            console.error("Supabase Staff Error:", staffError);
        }
        
        let staff = staffData?.find(s => 
            (s.username || '').toString().trim().toLowerCase() === cleanInputLower && 
            (s.password || '').toString().trim() === cleanPassword
        );
        
        if (staff) return { id: staff.id, name: staff.name, username: staff.username, role: staff.role as UserRole, school: staff.school, room: staff.room, npsn: staff.npsn, password: staff.password };
        
        // Try student
        let { data: studentData, error: studentError } = await supabase.from('students').select('*').ilike('nomor_peserta', `%${cleanInput}%`);
        if (studentError) {
            console.error("Supabase Student Error:", studentError);
        }
        
        let currStudent = studentData?.find(s => 
            (s.nomor_peserta || '').toString().trim().toLowerCase() === cleanInputLower && 
            (s.password || '').toString().trim() === cleanPassword
        );

        if (currStudent) {
            await supabase.from('students').update({ is_login: true }).eq('id', currStudent.id);
            const { data: mappings } = await supabase.from('student_exam_mapping').select('*').eq('student_id', currStudent.id);
            return { 
               id: currStudent.id, name: currStudent.name, username: currStudent.username || currStudent.nomor_peserta, role: UserRole.STUDENT, 
               school: currStudent.school, nomorPeserta: currStudent.nomor_peserta, gender: currStudent.gender, 
               birthDate: currStudent.birth_date, class: currStudent.class, isLogin: true, 
               mappings: mappings?.map(m => ({ id: m.id, studentId: m.student_id, examId: m.subject_id, examDate: m.exam_date, session: m.session, room: m.room })) || []
            };
        }
        return undefined;
    } catch (err: any) {
        console.error("Fetch DB error:", err);
        throw new Error("Gagal mengambil data dari database, pastikan koneksi internet stabil dan tabel sudah dibuat.");
    }
  },
  getExams: async (level?: 'SD'): Promise<Exam[]> => {
    // Optimization: Select only required columns and sum up real question lengths
    const data = await fetchAll('subjects', 'id, name, duration, question_count, token, is_active, education_level, shuffle_questions, shuffle_options, school_access, form_url, questions(id, points)');
    if (!data) return [];
    return data.map(d => ({
        id: d.id, title: d.name, subject: d.name, durationMinutes: d.duration, 
        questionCount: d.questions?.length || 0,
        token: d.token || '', isActive: d.is_active, 
        questions: d.questions as unknown as Question[] || [], // Partial array of Questions for points counting
        educationLevel: d.education_level || 'SD',
        shuffleQuestions: d.shuffle_questions, shuffleOptions: d.shuffle_options, schoolAccess: d.school_access || [],
        formUrl: d.form_url || ''
    }));
  },
  updateExamToken: async (examId: string, newToken: string): Promise<void> => {
    await supabase.from('subjects').update({ token: newToken }).eq('id', examId);
  },
  updateExamSchedule: async (examId: string, token: string, durationMinutes: number, startDate: string, endDate: string): Promise<void> => {
    await supabase.from('subjects').update({ token, duration: durationMinutes }).eq('id', examId);
  },
  createExam: async (exam: Exam): Promise<void> => {
    const { data } = await supabase.from('subjects').insert({
        name: exam.title, duration: exam.durationMinutes, question_count: exam.questionCount, 
        token: exam.token, education_level: exam.educationLevel, school_access: exam.schoolAccess || [],
        shuffle_questions: exam.shuffleQuestions || false, shuffle_options: exam.shuffleOptions || false,
        form_url: exam.formUrl || ''
    }).select().single();
    if(data && exam.questions?.length > 0) {
        await db.addQuestions(data.id, exam.questions);
    }
  },
  addQuestions: async (examId: string, questions: any[]): Promise<void> => {
    const payloads = questions.map(q => ({
        subject_id: examId, type: q.type.toLowerCase().includes('pg') ? 'pg' : 'bs', content: q, points: q.points || 1
    }));
    await supabase.from('questions').insert(payloads);
  },
  submitResult: async (result: ExamResult): Promise<void> => {
    // Optimization: Bulk upsert to finalize result and sync massal
    await supabase.from('results').upsert({
        exam_id: result.examId,
        peserta_id: result.studentId,
        score: result.score,
        answers: result.answers || [],
        status: result.status || 'finished',
        violation_count: result.cheatingAttempts || 0,
        finish_time: new Date().toISOString()
    }, { onConflict: 'exam_id,peserta_id' });
  },
  getAllResults: async (): Promise<ExamResult[]> => {
    let relData = null, relError = null;
    try {
        relData = await fetchAll('results', '*, students(name), subjects(name)');
    } catch(e) { relError = e; }
    
    if (!relError && relData) {
        return relData.map(d => ({
            id: d.id, studentId: d.peserta_id, examId: d.exam_id, score: d.score, submittedAt: d.finish_time,
            studentName: d.students?.name, examTitle: d.subjects?.name,
            totalQuestions: 0, cheatingAttempts: d.violation_count || 0, answers: d.answers, status: d.status
        }));
    }

    console.warn("Relational query failed, falling back to manual join.", relError);

    // Manual join Fallback
    const data = await fetchAll('results', '*');
    if (!data) return [];

    const [students, subjects] = await Promise.all([
        fetchAll('students', 'id, name'),
        fetchAll('subjects', 'id, name')
    ]);

    return data.map(d => ({
        id: d.id, studentId: d.peserta_id, examId: d.exam_id, score: d.score, submittedAt: d.finish_time,
        studentName: students?.find(s => s.id === d.peserta_id)?.name || 'Unknown',
        examTitle: subjects?.find(s => s.id === d.exam_id)?.name || 'Unknown',
        totalQuestions: 0, cheatingAttempts: d.violation_count || 0, answers: d.answers, status: d.status
    }));
  },
  getUsers: async (): Promise<User[]> => {
    let students: any[] = [];
    let staff: any[] = [];
    try { students = await fetchAll('students', '*, student_exam_mapping(id, subject_id, exam_date, session, room)'); } catch(e) { console.error("Error fetching students:", e); }
    try { staff = await fetchAll('staff', '*'); } catch(e) { console.error("Error fetching staff:", e); }

    let allUsers: User[] = [];
    if(students) {
        allUsers = allUsers.concat(students.map(d => ({
            id: d.id, name: d.name, username: d.nomor_peserta, role: UserRole.STUDENT,
            school: d.school, npsn: d.npsn, class: d.class, room: d.room, gender: d.gender, nomorPeserta: d.nomor_peserta,
            birthDate: d.birth_date, password: d.password, isLogin: d.is_login,
            mappings: d.student_exam_mapping?.map((m: any) => ({
                id: m.id, studentId: d.id, examId: m.subject_id, examDate: m.exam_date, session: m.session, room: m.room
            })) || []
        })));
    }
    if (staff) {
        allUsers = allUsers.concat(staff.map(d => ({
            id: d.id, name: d.name, username: d.username, password: d.password, role: d.role as UserRole,
            room: d.room, school: d.school, npsn: d.npsn
        })));
    }
    return allUsers;
  },
  addUser: async (user: User): Promise<void> => {
      if (user.role === UserRole.STUDENT) {
          await db.createUser(user);
      } else {
          await supabase.from('staff').insert({
              name: user.name, username: user.username || Math.random().toString().substring(2, 10), 
              password: user.password || '12345', role: user.role, school: 'PUSAT'
          });
      }
  },
  deleteUser: async (id: string): Promise<void> => {
    await supabase.from('students').delete().eq('id', id);
    await supabase.from('staff').delete().eq('id', id);
  },
  resetUserStatus: async (userId: string): Promise<void> => {
    await supabase.from('students').update({ is_login: false }).eq('id', userId);
  },
  resetUserPassword: async (userId: string): Promise<void> => {
    await supabase.from('students').update({ password: '' }).eq('id', userId);
  },
  resetAllLogins: async (): Promise<void> => {
    await supabase.from('students').update({ is_login: false }).neq('id', '00000000-0000-0000-0000-000000000000');
  },
  resetAllViolations: async (): Promise<void> => {
      await supabase.from('results').update({ violation_count: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
  },
  unblockAllUsers: async (): Promise<void> => {},
  getLightweightMonitoringData: async (): Promise<any> => {
    const students = await fetchAll('students', 'id, name, school, room, is_login');
    const results = await fetchAll('results', 'id, exam_id, peserta_id, status');
    return { students: students || [], results: results || [] };
  },
  updateUser: async (id: string, user: Partial<User>) => {
    await supabase.from('students').update({
        name: user.name, school: user.school, class: user.class, room: user.room, npsn: user.npsn, 
        password: user.password, gender: user.gender, birth_date: user.birthDate,
        nomor_peserta: user.nomorPeserta
    }).eq('id', id);
  },
  createUser: async (user: Partial<User>) => {
    await supabase.from('students').insert({
        name: user.name, school: user.school, class: user.class, room: user.room, npsn: user.npsn, 
        password: user.password, gender: user.gender, birth_date: user.birthDate,
        nomor_peserta: user.nomorPeserta || Math.random().toString().substring(2, 10)
    });
  },
  getStaff: async (): Promise<User[]> => {
    const data = await fetchAll('staff', '*');
    if(!data) return [];
    return data.map(d => ({
        id: d.id, name: d.name, username: d.username, password: d.password, role: d.role as UserRole,
        room: d.room, school: d.school, npsn: d.npsn
    }));
  },
  addStaff: async (staff: Partial<User>) => {
      await supabase.from('staff').insert({
          name: staff.name, username: staff.username, password: staff.password, 
          role: staff.role || 'PROKTOR', school: staff.school, room: staff.room, npsn: staff.npsn
      });
  },
  updateStaff: async (id: string, staff: Partial<User>) => {
      await supabase.from('staff').update({
          name: staff.name, username: staff.username, password: staff.password, 
          role: staff.role, school: staff.school, room: staff.room, npsn: staff.npsn
      }).eq('id', id);
  },
  deleteStaff: async (id: string) => {
      await supabase.from('staff').delete().eq('id', id);
  },
  deleteStudentMappingBatch: async (studentIds: string[], examId: string, examDate: string, session: string, room: string) => {
      const chunkSize = 200;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          const { error } = await supabase.from('student_exam_mapping')
              .delete()
              .in('student_id', chunk)
              .eq('subject_id', examId)
              .eq('exam_date', examDate || '')
              .eq('session', session || '')
              .eq('room', room || '');
          if (error) throw new Error(error.message);
      }
  },
  updateStudentMappingBatch: async (studentIds: string[], oldMapping: any, newMapping: any) => {
      const chunkSize = 200;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          const { error } = await supabase.from('student_exam_mapping')
              .update({
                  exam_date: newMapping.date || '',
                  session: newMapping.session || '',
                  room: newMapping.room || ''
              })
              .in('student_id', chunk)
              .eq('subject_id', oldMapping.examId)
              .eq('exam_date', oldMapping.date || '')
              .eq('session', oldMapping.session || '')
              .eq('room', oldMapping.room || '');
          if (error) throw new Error(error.message);
      }
  },
  resetCheatingCount: async (id: string) => {
      await supabase.from('results').update({ violation_count: 0 }).eq('id', id);
  },
  deleteExam: async (id: string) => {
      await supabase.from('subjects').delete().eq('id', id);
  },
  forceFinishAllWorking: async (id?: string) => {
      if (id) {
          await supabase.from('results').update({ status: 'finished' }).eq('exam_id', id).eq('status', 'working');
      } else {
          await supabase.from('results').update({ status: 'finished' }).eq('status', 'working');
      }
  },
  forceFinishStudents: async (studentIds: string[]) => {
      if (!studentIds || studentIds.length === 0) return;
      const chunkSize = 200;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          await supabase.from('results').update({ status: 'finished' }).eq('status', 'working').in('peserta_id', chunk);
      }
  },
  updateExamMapping: async (id: string, token: string, durationMinutes: number, examDate: string, session: string, schoolAccess: string[], shuffleQuestions: boolean, shuffleOptions: boolean, formUrl?: string) => {
      await supabase.from('subjects').update({ 
          token, 
          duration: durationMinutes,
          exam_date: examDate,
          session: session,
          school_access: schoolAccess,
          shuffle_questions: shuffleQuestions,
          shuffle_options: shuffleOptions,
          form_url: formUrl || ''
      }).eq('id', id);
  },
  updateQuestion: async (q: any) => {
      await supabase.from('questions').update({ content: q }).eq('id', q.id);
  },
  deleteQuestion: async (id: string, sId: string) => {
      // It's tricky to delete based on json content ID, standard supabase might need custom query
  },
  importStudents: async (users: any[]) => {
      const chunkSize = 500;
      for (let i = 0; i < users.length; i += chunkSize) {
          const chunk = users.slice(i, i + chunkSize);
          await supabase.from('students').insert(chunk.map(u => ({
              name: u.name, school: u.school, nomor_peserta: u.nomorPeserta,
              password: u.password, class: u.class, room: u.room, gender: u.gender, npsn: u.npsn
          })));
      }
  },
  getResultAnswers: async (id: string): Promise<any[]> => {
      const { data } = await supabase.from('results').select('answers').eq('id', id).single();
      return data?.answers || [];
  },
  updateResultScore: async (id: string, score: number, answers: any[]) => {
      await supabase.from('results').update({ score, answers }).eq('id', id);
  },
  updateStudentMapping: async (studentIds: string[], data: { examId: string, examDate?: string, room?: string, session?: string }) => {
      const chunkSize = 200;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          await supabase.from('student_exam_mapping')
              .delete()
              .in('student_id', chunk)
              .eq('subject_id', data.examId);

          const records = chunk.map(studentId => ({
              student_id: studentId,
              subject_id: data.examId,
              exam_date: data.examDate || '',
              room: data.room || '',
              session: data.session || ''
          }));
          const { error } = await supabase.from('student_exam_mapping').insert(records);
          if (error) throw new Error(error.message);
      }
  },
  deleteUserResults: async (userId: string) => {
      await supabase.from('results').delete().eq('peserta_id', userId);
  },
  startExamSession: async (userId: string, examId: string) => {
      const { data } = await supabase.from('results').select('id').eq('peserta_id', userId).eq('exam_id', examId).single();
      if(!data) {
          await supabase.from('results').insert({ peserta_id: userId, exam_id: examId, status: 'working' });
      }
  },
  getExamProgress: async (userId: string, examId: string): Promise<any> => {
      const { data } = await supabase.from('results').select('*').eq('peserta_id', userId).eq('exam_id', examId).single();
      if(!data) return null;
      return { id: data.id, current_number: 1, answers: data.answers || [], status: data.status, violation_count: data.violation_count || 0 };
  },
  saveExamProgress: async (userId: string, examId: string, answers: any[], violationCount: number, lastIndex: number) => {
      await supabase.from('results').update({
          answers,
          violation_count: violationCount,
          last_index: lastIndex
      }).eq('peserta_id', userId).eq('exam_id', examId);
  },
  reportViolation: async (userId: string, examId: string, violationCount: number) => {
      await supabase.from('results').update({
          violation_count: violationCount
      }).eq('peserta_id', userId).eq('exam_id', examId);
  },
  getExamById: async (id: string): Promise<Exam | undefined> => {
      // Optimization: Select only necessary columns
      const { data } = await supabase.from('subjects').select('id, name, duration, question_count, token, is_active, education_level, shuffle_options, shuffle_questions, form_url').eq('id', id).single();
      if(!data) return undefined;
      // Fetch all questions in one go (Batch fetching)
      const { data: qData } = await supabase.from('questions').select('content').eq('subject_id', id);
      const questions = qData ? qData.map(q => q.content) : [];
      return {
          id: data.id, title: data.name, subject: data.name, durationMinutes: data.duration,
          questionCount: data.question_count, token: data.token, isActive: data.is_active,
          educationLevel: data.education_level || 'SD', questions, shuffleOptions: data.shuffle_options,
          shuffleQuestions: data.shuffle_questions, formUrl: data.form_url || ''
      };
  },
  getStudentMappings: async (studentId: string): Promise<any> => {
      const { data } = await supabase.from('student_exam_mapping').select('*, subjects(*)').eq('student_id', studentId);
      if(!data) return { data: [] };
      return { data: data.map(d => ({
          examId: d.subject_id, examDate: d.exam_date, session: d.session, room: d.room,
          exam: { id: d.subjects.id, title: d.subjects.name, durationMinutes: d.subjects.duration, token: d.subjects.token }
      })) };
  },
  getExamSessions: async (): Promise<any[]> => [],
  createExamSession: async (s: any) => {},
  updateExamSession: async (id: string, u: any) => {},
  subscribeToStudentStatus: (studentId: string, cb: any): any => ({ unsubscribe: () => {} }),
  deleteExamSession: async (id: string) => {}
};
