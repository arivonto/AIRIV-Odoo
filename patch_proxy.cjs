const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all instances of `res.json(data)` with `res.status(response.status).json(data)`
code = code.replace(/res\.json\(data\);/g, 'res.status(response.status).json(data);');

fs.writeFileSync('server.ts', code);
