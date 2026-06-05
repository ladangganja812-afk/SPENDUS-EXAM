import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const p = (k: string) => env.split('\n').find(l => l.startsWith(k))?.split('=')[1] || '';
const supabase = createClient(p('VITE_SUPABASE_URL'), p('VITE_SUPABASE_ANON_KEY'));

async function fetchAll(table: string, selectQuery: string) {
  let allData: any[] = [];
  let from = 0;
  const step = 999;
  
  while (true) {
    const { data, error } = await supabase.from(table).select(selectQuery).range(from, from + step);
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    if (data.length <= step) break; // If it's less than step + 1, it means it's the last page. Actually it fetches step+1 items if you do range(0, 999), it fetches 1000 items. If data.length < 1000, we break.
    from += step + 1;
  }
  return allData;
}

async function check() {
  const data = await fetchAll('students', '*, student_exam_mapping(id, subject_id, exam_date, session, room)');
  console.log("Data size:", data?.length);
}

check();
