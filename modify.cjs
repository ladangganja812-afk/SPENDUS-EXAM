const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const target1 = `<div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-lg flex items-center">
                           <AlertTriangle size={20} className="mr-2 text-red-600"/> Data Pelanggaran Hari Ini
                       </h3>
                   </div>`;

const replace1 = `<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                       <h3 className="font-bold text-lg flex items-center">
                           <AlertTriangle size={20} className="mr-2 text-red-600"/> Data Pelanggaran Hari Ini
                       </h3>
                       <select
                           className="border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"
                           value={violationExamFilter}
                           onChange={(e) => setViolationExamFilter(e.target.value)}
                       >
                           <option value="ALL">Semua Mata Ujian</option>
                           {exams.map(ex => (
                               <option key={ex.id} value={ex.id}>{ex.title}</option>
                           ))}
                       </select>
                   </div>`;

const target2 = `                                     .filter(r => r.cheatingAttempts > 0)
                                      .filter(r => {
                                         const stu = users.find(u => u.id === r.studentId);`;

const replace2 = `                                     .filter(r => r.cheatingAttempts > 0)
                                      .filter(r => violationExamFilter === 'ALL' || r.examId === violationExamFilter)
                                      .filter(r => {
                                         const stu = users.find(u => u.id === r.studentId);`;
                                         
const target3 = `                               {results.filter(r => r.cheatingAttempts > 0).filter(r => {
                                  const stu = users.find(u => u.id === r.studentId);`;

const replace3 = `                               {results.filter(r => r.cheatingAttempts > 0).filter(r => violationExamFilter === 'ALL' || r.examId === violationExamFilter).filter(r => {
                                  const stu = users.find(u => u.id === r.studentId);`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);
code = code.replace(target3, replace3);

fs.writeFileSync('components/AdminDashboard.tsx', code);
console.log("Done");
