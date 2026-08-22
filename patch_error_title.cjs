const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<h2 className="text-xl font-semibold text-slate-700 mb-2">No Records Found</h2>',
  '<h2 className="text-xl font-semibold text-slate-700 mb-2">Action Unavailable</h2>'
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched error title");
