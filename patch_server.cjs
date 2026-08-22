const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'models/gemini-1.5-flash:generateContent',
  'models/gemini-3.6-flash:generateContent'
);

fs.writeFileSync('server.ts', code);
