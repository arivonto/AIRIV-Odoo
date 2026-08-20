const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

code = code.replace(/<p>Memuat data\.\.\.\/p>/g, '<p>Memuat data...</p>');

fs.writeFileSync('src/components/DynamicListView.tsx', code);
