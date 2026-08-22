const fs = require('fs');
const path = 'src/services/odoo.ts';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  `        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)`,
  `        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)`
);
fs.writeFileSync(path, code);
