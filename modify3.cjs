const fs = require('fs');
let code = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');

const anchor1 = `const handlePrintDaftarHadir = () => {`;

const insert1 = `const handlePrintPelanggaran = () => {
    const filteredResults = results
        .filter(r => r.cheatingAttempts > 0)
        .filter(r => violationExamFilter === 'ALL' || r.examId === violationExamFilter)
        .filter(r => {
            const stu = users.find(u => u.id === r.studentId);
            const map = stu?.mappings?.find(m => m.examId === r.examId);
            const isToday = map?.examDate === localTodayStr || (r.submittedAt && r.submittedAt.startsWith(localTodayStr));
            const isOngoing = r.status === 'working' || r.status === 'locked';
            return isToday || isOngoing;
        })
        .sort((a,b) => b.cheatingAttempts - a.cheatingAttempts);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = settings.schoolLogoUrl 
        ? \`<img src="\${settings.schoolLogoUrl}" class="kop-logo" />\` 
        : \`<div style="width:50px"></div>\`;

    const kopHtml = \`
        <div class="kop">
            \${logoHtml}
            <div class="kop-text">
                <div class="kop-instansi">\${dhConfig.kopInstansi || ''}</div>
                <div class="kop-sekolah">\${dhConfig.kopSekolah || settings.appName}</div>
                <div class="kop-alamat">\${dhConfig.kopAlamat || ''}</div>
            </div>
            <div style="width:50px"></div>
        </div>
    \`;

    let rowsHtml = '';
    if (filteredResults.length > 0) {
        filteredResults.forEach((r, i) => {
            const statusStr = r.status === 'working' ? 'Sedang Ujian' : r.status === 'finished' ? 'Selesai' : r.status === 'locked' ? 'Diblokir' : '-';
            const timeStr = r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString('id-ID') : '-';
            rowsHtml += \`
                <tr>
                    <td style="text-align: center">\${i+1}</td>
                    <td>\${r.studentName}</td>
                    <td>\${r.examTitle}</td>
                    <td style="text-align: center; font-weight: bold;">\${r.cheatingAttempts} Kali</td>
                    <td style="text-align: center">\${statusStr}</td>
                    <td style="text-align: center">\${timeStr}</td>
                </tr>
            \`;
        });
    } else {
        rowsHtml = \`
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">Tidak ada data pelanggaran hari ini</td>
            </tr>
        \`;
    }

    const htmlContent = \`
    <html>
        <head>
            <title>Cetak Data Pelanggaran</title>
            <style>
                body { font-family: 'Times New Roman', Times, serif; font-size: 12px; margin: 0; padding: 20px; }
                .kop { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid black; padding-bottom: 10px; margin-bottom: 2px; }
                .kop-wrapper { position: relative; margin-bottom: 20px; }
                .kop-wrapper:after { content: ''; display: block; border-bottom: 1px solid black; margin-top: 2px; width: 100%; position: absolute; left: 0; }
                .kop-logo { width: 70px; height: auto; max-height: 80px; object-fit: contain; }
                .kop-text { text-align: center; flex-grow: 1; padding: 0 10px; }
                .kop-instansi { font-size: 14px; font-weight: normal; text-transform: uppercase; letter-spacing: 1px; }
                .kop-sekolah { font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 2px 0; }
                .kop-alamat { font-size: 10px; font-style: normal; }
                
                .report-title { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 20px 0; text-decoration: underline; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 12px; }
                
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
                th, td { border: 1px solid black; padding: 6px 8px; }
                th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
                
                .signature { display: flex; justify-content: flex-end; margin-top: 40px; margin-right: 20px; font-size: 12px; }
                .signature-box { text-align: center; width: 250px; }
                .signature-name { font-weight: bold; text-decoration: underline; margin-top: 60px; }
                
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="kop-wrapper">
                \${kopHtml}
            </div>
            
            <div class="report-title">LAPORAN DATA PELANGGARAN PESERTA UJIAN</div>
            
            <div class="meta">
                <div>
                    <div><strong>Hari, Tanggal:</strong> \${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><strong>Filter Mapel:</strong> \${violationExamFilter === 'ALL' ? 'Semua Mata Ujian' : exams.find(e => e.id === violationExamFilter)?.title || violationExamFilter}</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%">No</th>
                        <th style="width: 25%">Nama Peserta</th>
                        <th style="width: 25%">Mata Ujian</th>
                        <th style="width: 15%">Jml Pelanggaran</th>
                        <th style="width: 15%">Status</th>
                        <th style="width: 15%">Waktu Selesai</th>
                    </tr>
                </thead>
                <tbody>
                    \${rowsHtml}
                </tbody>
            </table>
            
            <div class="signature">
                <div class="signature-box">
                    <div>Penanggung Jawab / Proktor</div>
                    <div class="signature-name">\${user.name || 'Admin'}</div>
                </div>
            </div>
        </body>
    </html>
    \`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

`;

code = code.replace(anchor1, insert1 + anchor1);

const anchor2 = `<select
                           className="border rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-auto"`;
                           
const insert2 = `
                       <div className="flex items-center gap-3 w-full md:w-auto">
                           <button 
                               onClick={handlePrintPelanggaran}
                               className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 shadow-md transition flex items-center print:hidden whitespace-nowrap"
                           >
                               <Printer size={16} className="mr-2"/> Cetak PDF
                           </button>
                           `;

const endAnchor2 = `                           ))}
                       </select>`;

code = code.replace(anchor2, insert2 + anchor2);
code = code.replace(endAnchor2, endAnchor2 + `\n                       </div>`);

fs.writeFileSync('components/AdminDashboard.tsx', code);
console.log("Written");
