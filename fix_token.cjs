const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const tIndex = code.indexOf('<span className="text-gray-600">Token Aktif:</span>');
if(tIndex > -1){
   let c2 = code.indexOf('RotateCcw', tIndex);
   let closeTag = code.indexOf('</div>', c2);
   let part = code.substring(code.lastIndexOf('<div className="flex items-center gap-2">', tIndex), closeTag + 6);
   code = code.replace(part, '{/* Token UI Removed */}');
   fs.writeFileSync('components/AdminDashboard.tsx', code);
}
