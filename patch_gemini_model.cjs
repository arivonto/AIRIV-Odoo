const fs = require('fs');
let code = fs.readFileSync('src/services/gemini.ts', 'utf8');

code = code.replace(
  "models/gemini-2.5-flash:generateContent",
  "models/gemini-1.5-flash:generateContent"
);

fs.writeFileSync('src/services/gemini.ts', code);
