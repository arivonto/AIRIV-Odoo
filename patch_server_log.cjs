const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');
content = content.replace('app.use(express.json());', 'app.use((req, res, next) => { console.log("[" + req.method + "] " + req.url); next(); });\n  app.use(express.json());');
fs.writeFileSync('/app/applet/server.ts', content);
