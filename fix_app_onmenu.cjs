const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /onMenuSelect=\{setActiveMenu\}/,
  `onMenuSelect={(menu) => {
           setActiveMenu(menu);
           if (window.innerWidth < 1024) setIsSidebarOpen(false);
         }}`
);

fs.writeFileSync('src/App.tsx', code);
