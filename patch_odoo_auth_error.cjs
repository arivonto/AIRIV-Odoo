const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

code = code.replace(/throw new Error\('Autentikasi gagal: Kredensial tidak valid\.'\);/g, 
  "throw new Error('Autentikasi gagal: Kredensial tidak valid (atau database OdooAIRIV tidak ditemukan).');");

fs.writeFileSync('src/services/odoo.ts', code);
