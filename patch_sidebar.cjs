const fs = require('fs');

let sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebarCode = sidebarCode.replace(
  `interface SidebarProps {\n  session: any;\n  activeMenu: string;\n  onMenuSelect: (menu: MenuOption) => void;\n  onLogout: () => void;\n}`,
  `interface SidebarProps {\n  session: any;\n  activeMenu: string;\n  onMenuSelect: (menu: MenuOption) => void;\n  onLogout: () => void;\n  isOpen: boolean;\n  onClose: () => void;\n}`
);

sidebarCode = sidebarCode.replace(
  `export function Sidebar({ session, activeMenu, onMenuSelect, onLogout }: SidebarProps) {`,
  `export function Sidebar({ session, activeMenu, onMenuSelect, onLogout, isOpen, onClose }: SidebarProps) {`
);

sidebarCode = sidebarCode.replace(
  `    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 z-20">`,
  `    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div className={\`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 transition-transform duration-300 ease-in-out \${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:w-64\`}>`
);

sidebarCode = sidebarCode.replace(
  `    </div>\n  );\n}`,
  `      </div>\n    </>\n  );\n}`
);

fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);
