const fs = require('fs');
let content = fs.readFileSync('/app/applet/server.ts', 'utf8');
content = content.replace('app.post("/api/web/menu/load_menus",', 'app.all("/api/web/menu/load_menus",');
fs.writeFileSync('/app/applet/server.ts', content);
