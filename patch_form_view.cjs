const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicFormView.tsx', 'utf8');

code = code.replace(/Loading form.../g, 'Memuat formulir...');
code = code.replace(/Edit \$/g, 'Edit $');
code = code.replace(/New \$/g, 'Buat $');
code = code.replace(/>Save</g, '>Simpan<');
code = code.replace(/Readonly/g, 'Hanya Baca');

fs.writeFileSync('src/components/DynamicFormView.tsx', code);
