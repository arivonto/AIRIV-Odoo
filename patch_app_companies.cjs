const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const imports = `import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar, getRoleMenus } from './components/Sidebar';
import { CrudView } from './components/CrudView';
import { UserProfile } from './components/UserProfile';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { odooService } from './services/odoo';
import { LayoutGrid, Building2, ChevronDown } from 'lucide-react';`;

code = code.replace(/import React, \{ useState, useEffect \} from 'react';[\s\S]*?import \{ LayoutGrid \} from 'lucide-react';/, imports);

code = code.replace(
  `  const [activeMenu, setActiveMenu] = useState<any>(null);`,
  `  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);`
);

const fetchCompaniesCode = `  useEffect(() => {
    if (session?.isSuperAdmin) {
      odooService.searchRead('res.company', [], ['id', 'name']).then(data => {
        setCompanies(data);
        if (data.length > 0 && !activeCompanyId) {
          setActiveCompanyId(data[0].id);
        }
      });
    }
  }, [session]);
  
  // Create an augmented session object with the selected company
  const currentSession = session ? { 
    ...session, 
    company_id: session.isSuperAdmin && activeCompanyId 
      ? [activeCompanyId, companies.find(c => c.id === activeCompanyId)?.name || ''] 
      : session.company_id 
  } : null;
`;
code = code.replace(`const handleLogin = (newSession: any) => {`, fetchCompaniesCode + `\n  const handleLogin = (newSession: any) => {`);

const renderContentRegex = /const renderContent = \(\) => \{[\s\S]*?return <CrudView key=\{activeMenu\.id\} menu=\{activeMenu\} session=\{session\} \/>;\n  \};/;
code = code.replace(renderContentRegex, `const renderContent = () => {
    if (!activeMenu) {
      return (
         <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
           <LayoutGrid className="w-16 h-16 mb-4 text-slate-300" />
           <p>Select a module from the sidebar</p>
         </div>
      );
    }
    
    if (activeMenu.id === 'profile') {
      return <UserProfile session={currentSession} />;
    }
    
    if (activeMenu.id === 'governance') {
      return <SuperAdminDashboard session={currentSession} companies={companies} />;
    }
    
    return <CrudView key={activeMenu.id} menu={activeMenu} session={currentSession} />;
  };`);

// Company Switcher in the footer or header? The user said "header dropdown", but we don't have a global header. We have a footer. We can add a simple header above renderContent().
const mainRegex = /<main className="flex-1 flex flex-col h-full overflow-hidden relative">/;
code = code.replace(mainRegex, `<main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {session.isSuperAdmin && (
          <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-white shrink-0 z-20 shadow-md">
            <div className="flex items-center gap-3">
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wide uppercase">Super Admin</span>
              <span className="text-sm text-slate-300">Global Governance Mode</span>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{companies.find(c => c.id === activeCompanyId)?.name || 'Select Tenant'}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>
              {showCompanyMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Switch Tenant Context</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {companies.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setActiveCompanyId(c.id); setShowCompanyMenu(false); }}
                        className={\`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between \${activeCompanyId === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50'}\`}
                      >
                        {c.name}
                        {activeCompanyId === c.id && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>
        )}`);

fs.writeFileSync('src/App.tsx', code);
