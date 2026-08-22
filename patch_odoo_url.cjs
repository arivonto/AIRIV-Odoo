const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');

const getBaseUrl = `const getBaseUrl = () => import.meta.env.VITE_ODOO_API_URL || 'https://odoo-api.airiv.id';`;

content = content.replace("const endpoint = '/api/jsonrpc';", `const endpoint = \`\${getBaseUrl()}/jsonrpc\`;`);
content = content.replace("const endpoint = '/api/web/session/authenticate';", `const endpoint = \`\${getBaseUrl()}/web/session/authenticate\`;`);
content = content.replace("const endpoint = '/api/web/action/load';", `const endpoint = \`\${getBaseUrl()}/web/action/load\`;`);
// Load menu will be replaced entirely

if (!content.includes('getBaseUrl')) {
  content = getBaseUrl + '\n' + content;
}

fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
