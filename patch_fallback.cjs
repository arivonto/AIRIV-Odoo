const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "'event': 'event.event', 'events': 'event.event'",
  "'event': 'event.event', 'events': 'event.event',\n    'settings': 'res.config.settings', 'apps': 'ir.module.module'"
);
fs.writeFileSync('src/App.tsx', code);
console.log("Patched fallback model");
