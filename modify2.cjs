const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const target2 = `                                     .filter(r => r.cheatingAttempts > 0)
                                     .filter(r => {`;

const replace2 = `                                     .filter(r => r.cheatingAttempts > 0)
                                     .filter(r => violationExamFilter === 'ALL' || r.examId === violationExamFilter)
                                     .filter(r => {`;

code = code.replace(target2, replace2);

fs.writeFileSync('components/AdminDashboard.tsx', code);
console.log("Done");
