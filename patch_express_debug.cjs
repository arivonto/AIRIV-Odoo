const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');
content = content.replace(
  'message: `Proxy error: Odoo tunnel returned HTML instead of JSON. Preview: ${responseText.slice(0, 50)}...`',
  'message: `BACKEND CAUGHT HTML: ${responseText.slice(0, 50)}...`'
);
fs.writeFileSync('/app/applet/server.ts', content);
