const fs = require('fs');
let code = fs.readFileSync('.env.example', 'utf8');
code = code.replace(
  'VITE_GOOGLE_CLIENT_ID=',
  'VITE_GOOGLE_CLIENT_ID=574868185565-ijgqtr7dbhnhessogd4gq08m3vbg3di6.apps.googleusercontent.com'
);
fs.writeFileSync('.env.example', code);
