const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

code = code.replace(/method: 'POST',/g, 'method: \'POST\',\n        credentials: "include",');

fs.writeFileSync('src/services/odoo.ts', code);
