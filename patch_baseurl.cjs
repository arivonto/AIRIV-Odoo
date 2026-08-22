const fs = require('fs');
let content = fs.readFileSync('src/services/odoo.ts', 'utf8');

const getBaseUrl = `const getBaseUrl = () => import.meta.env.VITE_ODOO_API_URL || 'https://odoo-api.airiv.id';\n\n`;

if (!content.includes('const getBaseUrl')) {
  content = getBaseUrl + content;
  fs.writeFileSync('src/services/odoo.ts', content);
  console.log("Added getBaseUrl");
}
