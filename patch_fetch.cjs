const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');

// The file has several fetch calls. Let's find them and ensure they have credentials: 'include' and mode: 'cors'
// Also, header needs 'Content-Type' and 'Accept' but no 'x-odoo-*' headers since we go directly to the Odoo server now.

content = content.replace(/headers: \{\s*'Content-Type': 'application\/json',\s*'Accept': 'application\/json',\s*'x-odoo-url': url,\s*'x-odoo-session-id': session_id\s*\}/g, "headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }");
content = content.replace(/headers: \{\s*'Content-Type': 'application\/json',\s*'Accept': 'application\/json',\s*'x-odoo-url': url\s*\}/g, "headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }");
content = content.replace(/method: 'POST',/g, "method: 'POST',\n        mode: 'cors',\n        credentials: 'include',");

// For load menus, it uses executeKw
// Wait, the loadMenus needs to be completely rewritten. Let's see the current one.
fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
