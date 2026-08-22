const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

code = code.replace(/setOcrData\\(\\{\\}\\);/g, `setFormData({ name: '', nik: '', street: '', subdistrict: '', city: '', province: '', occupation: '' });`);

fs.writeFileSync('src/components/UserProfile.tsx', code);
