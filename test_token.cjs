const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const tIndex = code.indexOf('<span className="text-gray-600">Token Aktif:</span>');
if(tIndex > -1){
   console.log('FOUND');
   const start = code.lastIndexOf('<div', tIndex);
   const endMatch = code.indexOf(')}', tIndex);
   if(endMatch > -1) {
       // remove this whole block from `start` to `endMatch + 2` + end div!
       // But wait! It is inside `<div className="flex items-center gap-2">` which is closed later.
       // Let's just simply replace out the whole `<div className="flex items-center gap-2">...</div>` block.
       let content = code.substring(start, endMatch + 200);
       console.log('TO REPLACE:', content);
   }
}
