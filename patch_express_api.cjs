const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');
content = content.replace('app.use(vite.middlewares);', 'app.all("/api/*", (req, res) => { res.status(404).json({ error: "API route not found: " + req.method + " " + req.url }); });\n    app.use(vite.middlewares);');
fs.writeFileSync('/app/applet/server.ts', content);
