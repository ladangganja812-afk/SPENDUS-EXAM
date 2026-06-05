const fs = require('fs');

let content = fs.readFileSync('services/database.ts', 'utf8');

// Chunking for updateStudentMapping
content = content.replace(
    `  updateStudentMapping: async (studentIds: string[], data: { examId: string, examDate?: string, room?: string, session?: string }) => {
      await supabase.from('student_exam_mapping')
          .delete()
          .in('student_id', studentIds)
          .eq('subject_id', data.examId);

      const records = studentIds.map(studentId => ({
          student_id: studentId,
          subject_id: data.examId,
          exam_date: data.examDate || '',
          room: data.room || '',
          session: data.session || ''
      }));
      const { error } = await supabase.from('student_exam_mapping').insert(records);
      if (error) throw new Error(error.message);
  },`,
    `  updateStudentMapping: async (studentIds: string[], data: { examId: string, examDate?: string, room?: string, session?: string }) => {
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
  },`
);

// chunking for forceFinishStudents
content = content.replace(
    `  forceFinishStudents: async (studentIds: string[]) => {
      if (!studentIds || studentIds.length === 0) return;
      await supabase.from('results').update({ status: 'finished' }).eq('status', 'working').in('student_id', studentIds);
  },`,
    `  forceFinishStudents: async (studentIds: string[]) => {
      if (!studentIds || studentIds.length === 0) return;
      const chunkSize = 200;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
          const chunk = studentIds.slice(i, i + chunkSize);
          await supabase.from('results').update({ status: 'finished' }).eq('status', 'working').in('student_id', chunk); // Note: it's actually peserta_id in results table. Let's fix it by the way!
      }
  },`
);

content = content.replace(`.in('student_id', chunk); // Note: it's actually peserta_id in results table. Let's fix it by the way!`, `.in('peserta_id', chunk);`);

// chunking deleteStudentMappingBatch
content = content.replace(
    `  deleteStudentMappingBatch: async (studentIds: string[], examId: string, examDate: string, session: string, room: string) => {
      let query = supabase.from('student_exam_mapping')
          .delete()
          .in('student_id', studentIds)
          .eq('subject_id', examId)
          .eq('exam_date', examDate || '')
          .eq('session', session || '')
          .eq('room', room || '');
          
      const { error } = await query;
      if (error) throw new Error(error.message);
  },`,
    `  deleteStudentMappingBatch: async (studentIds: string[], examId: string, examDate: string, session: string, room: string) => {
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
  },`
);

// chunking updateStudentMappingBatch
content = content.replace(
    `  updateStudentMappingBatch: async (studentIds: string[], oldMapping: any, newMapping: any) => {
      let query = supabase.from('student_exam_mapping')
          .update({
              exam_date: newMapping.date || '',
              session: newMapping.session || '',
              room: newMapping.room || ''
          })
          .in('student_id', studentIds)
          .eq('subject_id', oldMapping.examId)
          .eq('exam_date', oldMapping.date || '')
          .eq('session', oldMapping.session || '')
          .eq('room', oldMapping.room || '');
          
      const { error } = await query;
      if (error) throw new Error(error.message);
  },`,
    `  updateStudentMappingBatch: async (studentIds: string[], oldMapping: any, newMapping: any) => {
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
  },`
);

fs.writeFileSync('services/database.ts', content);
console.log("Patched other chunks");
