const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/AI Consultant/g, 'Konsultan AI');
code = code.replace(/Connected/g, 'Terhubung');
code = code.replace(/Offline/g, 'Terputus');
code = code.replace(/Connection Settings/g, 'Pengaturan Koneksi');

fs.writeFileSync('src/App.tsx', code);
