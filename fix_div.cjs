const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

code = code.replace(`                                    <p className="text-[10px] text-gray-400 mt-1">Jika diisi, peserta akan mengerjakan via form ini.</p>
                                </div>
                           </div>

                           {/* Right Column: Date & Session */}`, 
`                                    <p className="text-[10px] text-gray-400 mt-1">Jika diisi, peserta akan mengerjakan via form ini.</p>
                                </div>

                           {/* Right Column: Date & Session */}`);

fs.writeFileSync('components/AdminDashboard.tsx', code);
