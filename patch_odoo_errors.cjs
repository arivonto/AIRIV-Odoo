const fs = require('fs');
let code = fs.readFileSync('src/services/odoo.ts', 'utf8');

code = code.replace(/throw new Error\(\`HTTP Error: \$\{response\.status\}\`\);/g, 
  `if (response.status === 502) throw new Error('Koneksi ke server Odoo gagal (502 Bad Gateway). Server Odoo Anda sedang offline atau tidak dapat diakses.');
        throw new Error(\`HTTP Error: \${response.status}\`);`);

fs.writeFileSync('src/services/odoo.ts', code);
