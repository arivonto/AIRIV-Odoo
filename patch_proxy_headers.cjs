const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/"Accept": "application\/json",/g, '"Accept": "application/json",\n          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",');

fs.writeFileSync('server.ts', code);
