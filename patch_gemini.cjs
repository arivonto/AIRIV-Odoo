const fs = require('fs');
let code = fs.readFileSync('src/services/gemini.ts', 'utf8');

const regex = /const resData = await response\.json\(\);[\s\S]*?resolve\(\{ extracted: JSON\.parse\(cleanJson\), preview: compressedBase64 \}\);/;
const replacement = `const resData = await response.json();
          resolve({ extracted: resData, preview: compressedBase64 });`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/services/gemini.ts', code);
