const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            <Settings onConnect={() => {
              setIsConnected(true);
              loadMenus();
              setActiveTopMenuId(null);
            }} />`;

const replace = `            <Settings onConnect={() => {
              setIsConnected(true);
              // loadMenus is called by useEffect on isConnected change
            }} />`;

code = code.replace(target, replace);
fs.writeFileSync('src/App.tsx', code);
