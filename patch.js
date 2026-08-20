const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      roots.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      setRootMenus(roots);
    } catch (e: any) {`;

const replacement = `      roots.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      setRootMenus(roots);
      
      if (roots.length > 0) {
        const firstRoot = roots[0];
        setActiveTopMenuId(firstRoot.id);
        
        let terminalMenu = firstRoot;
        while (terminalMenu.children && terminalMenu.children.length > 0) {
           const childId = terminalMenu.children[0];
           if (menuData[childId]) {
             terminalMenu = menuData[childId];
           } else {
             break;
           }
        }
        
        setActiveSubMenuId(terminalMenu.id);
        resolveAction(terminalMenu);
      }
    } catch (e: any) {`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
