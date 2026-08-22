const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /onLogout=\{handleLogout\}/,
  `onLogout={handleLogout}
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}`
);

fs.writeFileSync('src/App.tsx', code);
