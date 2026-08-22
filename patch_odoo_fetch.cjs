const fs = require('fs');
let content = fs.readFileSync('/app/applet/src/services/odoo.ts', 'utf8');

const replacement = `const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        if (responseText.includes('502') || responseText.includes('504')) {
          throw new Error('Odoo is busy applying your modules. This takes a few seconds. Please refresh the page in a moment.');
        }
        throw new Error('Server returned HTML instead of JSON: ' + responseText.substring(0, 100));
      }`;

content = content.replace(/const data = await response\.json\(\);/g, replacement);

fs.writeFileSync('/app/applet/src/services/odoo.ts', content);
