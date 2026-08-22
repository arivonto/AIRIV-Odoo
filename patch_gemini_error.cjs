const fs = require('fs');
let code = fs.readFileSync('src/services/gemini.ts', 'utf8');

code = code.replace(
  "throw new Error(`API returned HTTP ${response.status}`);",
  "const errText = await response.text();\n            throw new Error(`API returned HTTP ${response.status}: ${errText}`);"
);

fs.writeFileSync('src/services/gemini.ts', code);
