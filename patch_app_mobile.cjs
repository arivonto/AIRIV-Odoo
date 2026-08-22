const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add Menu to imports
code = code.replace(
  `import { LayoutGrid, Building2, ChevronDown } from 'lucide-react';`,
  `import { LayoutGrid, Building2, ChevronDown, Menu, UserCircle } from 'lucide-react';`
);

// Add isSidebarOpen state
code = code.replace(
  `  const [showCompanyMenu, setShowCompanyMenu] = useState(false);`,
  `  const [showCompanyMenu, setShowCompanyMenu] = useState(false);\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);`
);

// Add window resize listener
const useEffectCompany = `  useEffect(() => {
    if (session?.isSuperAdmin) {
      odooService.searchRead('res.company', [], ['id', 'name']).then(data => {
        setCompanies(data);
        if (data.length > 0 && !activeCompanyId) {
          setActiveCompanyId(data[0].id);
        }
      });
    }
  }, [session]);`;

const resizeListener = `  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);`;
  
code = code.replace(useEffectCompany, useEffectCompany + '\n' + resizeListener);

// Handle sidebar auto-collapse
code = code.replace(
  `         onMenuSelect={setActiveMenu}`,
  `         onMenuSelect={(menu) => {
           setActiveMenu(menu);
           if (window.innerWidth < 1024) setIsSidebarOpen(false);
         }}`
);

code = code.replace(
  `         onLogout={handleLogout}`,
  `         onLogout={handleLogout}
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)}`
);

// Add mobile header inside main
const mainHeaderStr = `<main className="flex-1 flex flex-col h-full overflow-hidden relative">`;
const mobileHeader = `
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="truncate max-w-[120px] sm:max-w-[200px]">OdooAIRIV</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveMenu({ id: 'profile' });
            }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
              {session.username ? session.username.charAt(0).toUpperCase() : 'U'}
            </span>
          </button>
        </header>
`;
code = code.replace(mainHeaderStr, mainHeaderStr + mobileHeader);

fs.writeFileSync('src/App.tsx', code);
