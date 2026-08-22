const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = code.replace(
  /clientId=\{import\.meta\.env\.VITE_GOOGLE_CLIENT_ID \|\| '[^']+'\}/,
  `clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '574868185565-ijgqtr7dbhnhessogd4gq08m3vbg3di6.apps.googleusercontent.com'}`
);
fs.writeFileSync('src/main.tsx', code);
