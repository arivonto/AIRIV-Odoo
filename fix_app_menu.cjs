const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const handleTopMenuClick = (menu: any) => {
    setActiveTopMenuId(menu.id);
    setActiveAction(null);
    setIsSidebarOpen(false);

    if (menu.children && menu.children.length > 0) {
      const firstChild = allMenus[menu.children[0]];
      setActiveSubMenuId(firstChild.id);
      
      // If it's a leaf node, load action
      if (!firstChild.children || firstChild.children.length === 0) {
         resolveAction(firstChild);
      }
    } else {
       // It's a top menu with no children, just load it
       resolveAction(menu);
    }
  };`;

const newStr = `  const handleTopMenuClick = (menu: any) => {
    setActiveTopMenuId(menu.id);
    setActiveAction(null);
    setIsSidebarOpen(false);

    let currentNode = menu;
    // Auto-select the first leaf node
    while (currentNode && currentNode.children && currentNode.children.length > 0) {
       currentNode = allMenus[currentNode.children[0]];
    }
    
    if (currentNode && currentNode.id !== menu.id) {
       setActiveSubMenuId(currentNode.id);
       resolveAction(currentNode);
    } else {
       resolveAction(menu);
    }
  };`;

code = code.replace(targetStr, newStr);

const handleSubMenuTarget = `  const handleSubMenuClick = (menu: any) => {
    setActiveSubMenuId(menu.id);
    if (!menu.children || menu.children.length === 0) {
      resolveAction(menu);
      setIsSidebarOpen(false);
    }
  };`;

const newSubMenuStr = `  const handleSubMenuClick = (menu: any) => {
    setActiveSubMenuId(menu.id);
    let currentNode = menu;
    while (currentNode && currentNode.children && currentNode.children.length > 0) {
       currentNode = allMenus[currentNode.children[0]];
    }
    if (currentNode) {
      resolveAction(currentNode);
      setIsSidebarOpen(false);
    }
  };`;

code = code.replace(handleSubMenuTarget, newSubMenuStr);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx menu clicks");
