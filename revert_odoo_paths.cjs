const fs = require('fs');

let text = fs.readFileSync('src/services/odoo.ts', 'utf8');

// Replace the endpoints back to the relative proxy
text = text.replace(/const endpoint = `\${getBaseUrl\(\)}\/jsonrpc`;/g, "const endpoint = '/api/odoo/jsonrpc';");
text = text.replace(/const endpoint = `\${getBaseUrl\(\)}\/web\/dataset\/call_kw`;/g, "const endpoint = '/api/odoo/web/dataset/call_kw';");

// Make sure we pass x-odoo-url
// Instead of complex regex, let's just replace the headers block for POST
// Actually, earlier I changed headers to:
// headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
// Let's replace it with:
// headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-odoo-url': this.config.url || 'https://odoo-api.airiv.id' },

// We can do this globally for fetch inside odoo.ts
text = text.replace(/headers: \{ 'Content-Type': 'application\/json', 'Accept': 'application\/json' \}/g, "headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'x-odoo-url': this.config.url || 'https://odoo-api.airiv.id' }");

fs.writeFileSync('src/services/odoo.ts', text);
console.log("Reverted odoo.ts to use proxy.");
