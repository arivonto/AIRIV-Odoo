import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar, getRoleMenus } from './components/Sidebar';
import { CrudView } from './components/CrudView';
import { UserProfile } from './components/UserProfile';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { odooService } from './services/odoo';
import { LayoutGrid, Building2, ChevronDown, Menu, UserCircle } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
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
  }, []);

    useEffect(() => {
    if (session?.isSuperAdmin) {
      odooService.searchRead('res.company', [], ['id', 'name']).then(data => {
        setCompanies(data);
        if (data.length > 0 && !activeCompanyId) {
          setActiveCompanyId(data[0].id);
        }
      });
    }
  }, [session]);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Create an augmented session object with the selected company
  const currentSession = session ? { 
    ...session, 
    company_id: session.isSuperAdmin && activeCompanyId 
      ? [activeCompanyId, companies.find(c => c.id === activeCompanyId)?.name || ''] 
      : session.company_id 
  } : null;

  const handleLogin = (newSession: any) => {
    setSession(newSession);
    localStorage.setItem('odoo_session', JSON.stringify(newSession));
    const defaultMenus = getRoleMenus(newSession.username);
    if (defaultMenus.length > 0) {
      setActiveMenu(defaultMenus[0]);
    }
  };

  const handleLogout = async () => {
    try {
      await odooService.logout();
    } catch (e) {}
    setSession(null);
    setActiveMenu(null);
    localStorage.removeItem('odoo_session');
  };

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
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
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar 
        session={session} 
        activeMenu={activeMenu?.id} 
        onMenuSelect={(menu) => {
           setActiveMenu(menu);
           if (window.innerWidth < 1024) setIsSidebarOpen(false);
         }} 
        onLogout={handleLogout}
         isOpen={isSidebarOpen}
         onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
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
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
            className="flex items-center gap-2"
          >
            <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm">
              {session.username ? session.username.charAt(0).toUpperCase() : 'U'}
            </span>
          </button>
        </header>

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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${activeCompanyId === c.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50'}`}
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
        )}
        {renderContent()}

        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-700">Active</span>
            </div>
            <div>
              Database: <span className="font-medium text-slate-700">OdooAIRIV</span>
            </div>
            <div>
              Logged in as: <span className="font-medium text-slate-700">{session.name || session.username}</span>
            </div>
          </div>
          <div>
            Timezone: <span className="font-medium text-slate-700">WIB / Asia/Jakarta</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
