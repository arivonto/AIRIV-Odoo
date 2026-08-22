const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');
content = content.split("throw new Error('Server returned HTML instead of JSON: ' + responseText.substring(0, 100));").join("throw new Error('Server returned HTML instead of JSON (Status ' + response.status + ' from ' + response.url + '): ' + responseText.substring(0, 100));");
fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
