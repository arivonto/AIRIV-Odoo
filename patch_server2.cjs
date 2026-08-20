const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/method: "POST",/g, 'method: "POST",\n        credentials: "include",');

fs.writeFileSync('server.ts', code);
