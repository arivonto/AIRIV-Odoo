const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

code = code.replace(/No records found in this company \/ category/g, 'Belum ada data tersedia di kategori ini');
code = code.replace(/Try clearing filters or checking your access rights\./g, 'Data kosong atau Anda tidak memiliki hak akses.');
code = code.replace(/>Create New</g, '>Buat Baru<');
code = code.replace(/>Create</g, '>Buat<');
code = code.replace(/>Search...</g, '>Cari...<');
code = code.replace(/>Showing /g, '>Menampilkan ');
code = code.replace(/to <span/g, 'hingga <span');
code = code.replace(/ records</g, ' data<');
code = code.replace(/Loading records...</g, 'Memuat data...');

fs.writeFileSync('src/components/DynamicListView.tsx', code);
