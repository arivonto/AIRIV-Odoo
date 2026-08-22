const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(
  `const domain = menu.domain || [];`,
  `const domain = menu.domain ? [...menu.domain] : [];`
);
fs.writeFileSync(path, code);
