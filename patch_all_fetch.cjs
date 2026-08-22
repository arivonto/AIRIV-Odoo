const fs = require('fs');
let content = fs.readFileSync('src/services/odoo.ts', 'utf8');

// The fetch calls look like:
// const response = await fetch(endpoint, {
//   method: 'POST',
//   mode: 'cors',
//   credentials: 'include',
//   headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//   body: JSON.stringify(payload),
// });

// Some might not have mode: 'cors' and credentials: 'include'.
// Let's just string replace the standard block if it has missing parts.

content = content.replace(/method: 'POST',\s*headers: {/g, "method: 'POST',\n        mode: 'cors',\n        credentials: 'include',\n        headers: {");

// Some might have old x-odoo headers:
content = content.replace(/'x-odoo-url': url,/g, "");
content = content.replace(/'x-odoo-session-id': session_id/g, "");

fs.writeFileSync('src/services/odoo.ts', content);
