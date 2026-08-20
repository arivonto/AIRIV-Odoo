const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

code = code.replace(/placeholder="Search..."/g, 'placeholder="Cari..."');
code = code.replace(/Showing /g, 'Menampilkan ');
code = code.replace(/ records/g, ' data');

fs.writeFileSync('src/components/DynamicListView.tsx', code);
