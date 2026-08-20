const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

code = code.replace(/sessionStorage/g, 'localStorage');

fs.writeFileSync('src/services/odoo.ts', code);
