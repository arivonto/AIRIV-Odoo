const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');
content = content.replace("const endpoint = '/api/web/menu/load_menus';", "const endpoint = '/api/web/menu/load_menus?t=' + Date.now();");
fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
