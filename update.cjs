const fs = require('fs');

const path = 'src/services/odoo.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
`let currentSession: any = null;

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('odoo_session');
  if (stored) {
    try {
      currentSession = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse odoo session");
    }
  }
}`,
`let currentSession: any = null;

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('odoo_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.uid && parsed.apiKey) {
        currentSession = parsed;
      } else {
        localStorage.removeItem('odoo_session');
      }
    } catch (e) {
      console.error("Failed to parse odoo session");
    }
  }
}`);

code = code.replace(
`  async executeKw(model: string, method: string, args: any[], kwargs: any = {}) {
    // If not in current session but in localStorage (e.g. page refresh)
    if (!currentSession && typeof window !== 'undefined') {
       const stored = localStorage.getItem('odoo_session');
       if (stored) currentSession = JSON.parse(stored);
    }`,
`  async executeKw(model: string, method: string, args: any[], kwargs: any = {}) {
    // If not in current session but in localStorage (e.g. page refresh)
    if (!currentSession && typeof window !== 'undefined') {
       const stored = localStorage.getItem('odoo_session');
       if (stored) {
         const parsed = JSON.parse(stored);
         if (parsed && parsed.uid && parsed.apiKey) {
           currentSession = parsed;
         }
       }
    }`);

fs.writeFileSync(path, code);
console.log("Updated odoo.ts");

const appPath = 'src/App.tsx';
let appCode = fs.readFileSync(appPath, 'utf8');

appCode = appCode.replace(
`  useEffect(() => {
    const saved = localStorage.getItem('odoo_session');
    if (saved) {
      try {
        const parsedSession = JSON.parse(saved);
        setSession(parsedSession);
        const defaultMenus = getRoleMenus(parsedSession.username);
        if (defaultMenus.length > 0) {
          setActiveMenu(defaultMenus[0]);
        }
      } catch (e) {}
    }
  }, []);`,
`  useEffect(() => {
    const saved = localStorage.getItem('odoo_session');
    if (saved) {
      try {
        const parsedSession = JSON.parse(saved);
        if (parsedSession && parsedSession.uid && parsedSession.apiKey) {
          setSession(parsedSession);
          const defaultMenus = getRoleMenus(parsedSession.username);
          if (defaultMenus.length > 0) {
            setActiveMenu(defaultMenus[0]);
          }
        } else {
          localStorage.removeItem('odoo_session');
        }
      } catch (e) {}
    }
  }, []);`);

fs.writeFileSync(appPath, appCode);
console.log("Updated App.tsx");

