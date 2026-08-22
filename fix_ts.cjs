const fs = require('fs');

// Fix server.ts
let serverText = fs.readFileSync('server.ts', 'utf8');
serverText = serverText.replace(/req.headers\["x-odoo-url"\] \|\|/g, '(req.headers["x-odoo-url"] as string) ||');
fs.writeFileSync('server.ts', serverText);

// Fix odoo.ts
let odooText = fs.readFileSync('src/services/odoo.ts', 'utf8');
// Fix boolean assignment
// 369: let actionID = false; 
// 372: actionID = parseInt(parts[1], 10);
// should be: let actionID: number | false = false;
odooText = odooText.replace('let actionID = false;', 'let actionID: number | false = false;');
fs.writeFileSync('src/services/odoo.ts', odooText);
console.log("Fixed TS errors");
