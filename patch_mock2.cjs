const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

code = code.replace(/actionType === 'ir.actions.act_window'/g, "model === 'ir.actions.act_window'");

fs.writeFileSync('src/services/odoo.ts', code);
