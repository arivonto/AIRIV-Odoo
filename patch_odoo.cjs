const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

// Add mode: 'cors'
code = code.replace(/credentials: "include",/g, "credentials: \"include\",\n        mode: 'cors',");

// Replace response.json() with text check
code = code.replace(/const data = await response\.json\(\);/g, `const responseText = await response.text();
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
        throw new Error('Sesi autentikasi tidak valid atau telah berakhir.');
      }
      const data = JSON.parse(responseText);`);

fs.writeFileSync('src/services/odoo.ts', code);
