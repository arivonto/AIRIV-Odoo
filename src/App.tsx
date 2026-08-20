import React, { useState, useEffect } from 'react';
import { Settings } from './components/Settings';
import { DynamicListView } from './components/DynamicListView';
import { AIConsultantModal } from './components/AIConsultantModal';
import { odooClient } from './services/odoo';
import { Menu, X, Settings as SettingsIcon, Loader2, Database, LayoutGrid, AlertCircle, RefreshCw, ChevronDown, Package, Bot } from 'lucide-react';

export default function App() {
  const [isTerhubung, setIsTerhubung] = useState(false);
  const [latency, setLatency] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  
  const [allMenus, setAllMenus] = useState<Record<string, any>>({});
  const [rootMenus, setRootMenus] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [menuError, setMenuError] = useState('');
  
  const [activeTopMenuId, setActiveTopMenuId] = useState<number | 'settings' | null>('settings');
  const [activeSubMenuId, setActiveSubMenuId] = useState<number | null>(null);
  const [activeAction, setActiveAction] = useState<any>(null);

  useEffect(() => {
    const config = odooClient.getConfig();
    if ((config.db && config.uid && config.apiKey) || config.useMock) {
      setIsTerhubung(true);
    }

    const interval = setInterval(() => {
      setLatency(odooClient.getLatency());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isTerhubung) {
      loadMenus();
    } else {
      setAllMenus({});
      setRootMenus([]);
      setActiveTopMenuId('settings');
    }
  }, [isTerhubung]);

  const loadMenus = async () => {
    setLoadingMenus(true);
    setMenuError('');
    try {
      const menuData = await odooClient.loadMenus();
      setAllMenus(menuData);

      // Determine root menus
      let roots: any[] = [];
      if (menuData.root && menuData.root.children) {
        roots = menuData.root.children.map((id: number | string) => menuData[id]).filter(Boolean);
      } else {
        // Fallback: Find menus that are not in any children arrays
        const allChildrenIds = new Set();
        Object.values(menuData).forEach((m: any) => {
          if (m && m.children && Array.isArray(m.children)) {
            m.children.forEach((c: any) => allChildrenIds.add(c));
          }
        });
        roots = Object.values(menuData).filter((m: any) => m && m.id && !allChildrenIds.has(m.id) && m.id !== 'root');
      }
      
      // Sort root menus typically they have sequence or just by id
      roots.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
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
    } catch (e: any) {
      setMenuError(`Failed to load menus: ${e.message}`);
    } finally {
      setLoadingMenus(false);
    }
  };

  const fallbackMap: Record<string, string> = {
    'crm': 'crm.lead', 'leads': 'crm.lead', 'pipeline': 'crm.lead',
    'sale': 'sale.order', 'sale_management': 'sale.order', 'sales': 'sale.order', 'quotations': 'sale.order', 'orders': 'sale.order',
    'purchase': 'purchase.order', 'requests for quotation': 'purchase.order',
    'stock': 'stock.picking', 'inventory': 'stock.picking', 'transfers': 'stock.picking', 'receipts': 'stock.picking',
    'account': 'account.move', 'invoicing': 'account.move', 'accounting': 'account.move', 'bills': 'account.move', 'invoices': 'account.move',
    'point_of_sale': 'pos.order', 'point of sale': 'pos.order',
    'hr': 'hr.employee', 'employees': 'hr.employee',
    'hr_recruitment': 'hr.applicant', 'recruitment': 'hr.applicant', 'job applications': 'hr.applicant',
    'fleet': 'fleet.vehicle', 'vehicles': 'fleet.vehicle',
    'project': 'project.task', 'projects': 'project.task', 'tasks': 'project.task',
    'contacts': 'res.partner', 'customers': 'res.partner', 'vendors': 'res.partner',
    'calendar': 'calendar.event', 'appointments': 'calendar.event',
    'maintenance': 'maintenance.request', 'maintenance requests': 'maintenance.request',
    'event': 'event.event', 'events': 'event.event'
  };

  const getFallbackModel = (menu: any) => {
    const namesToMatch = [menu.xmlid?.split('.')[0], menu.name?.toLowerCase()].filter(Boolean);
    for (const name of namesToMatch) {
      if (!name) continue;
      for (const [key, val] of Object.entries(fallbackMap)) {
         if (name === key || name.includes(key)) {
           return val;
         }
      }
    }
    return null;
  };

  const [isResolving, setIsResolving] = useState(false);
  const resolveAction = async (menu: any) => {
    setIsResolving(true);
    setActiveAction(null);
    let actionId = menu.actionID || menu.action;
    if (typeof actionId === 'string' && actionId.includes(',')) {
       actionId = parseInt(actionId.split(',')[1]);
    }
    
    const fallbackModel = getFallbackModel(menu);

    if (actionId) {
      try {
        const loadedAction = await odooClient.loadAction(actionId);
        if (loadedAction && loadedAction.res_model) {
          setActiveAction(loadedAction);
          setIsResolving(false);
          return;
        } else if (loadedAction && loadedAction.type) {
           // Action exists but no res_model (e.g. client action)
           if (fallbackModel) {
              setActiveAction({ name: menu.name, res_model: fallbackModel, views: [['list', 'tree'], ['form', 'form']], domain: [], context: {} });
           } else {
              setActiveAction({ error: `Action ${loadedAction.type} not fully supported here, and no fallback model available for ${menu.name}.` });
           }
           setIsResolving(false);
           return;
        }
      } catch (e: any) {
        console.warn('Action load failed:', e.message);
      }
    }

    // Fallback if actionId missing or failed
    if (fallbackModel) {
      setActiveAction({ name: menu.name, res_model: fallbackModel, views: [['list', 'tree'], ['form', 'form']], domain: [], context: {} });
    } else {
      setActiveAction({ error: `No valid action or fallback model found for "${menu.name}".` });
    }
    setIsResolving(false);
  };

  const handleTopMenuClick = (menu: any) => {
    setActiveTopMenuId(menu.id);
    setActiveAction(null);
    setIsSidebarOpen(false);

    if (menu.children && menu.children.length > 0) {
       const firstChildId = menu.children[0];
       const firstChild = allMenus[firstChildId];
       if (firstChild) {
          handleSubMenuClick(firstChild);
       }
    } else {
       // Root menu with no children, try to resolve its own action
       handleSubMenuClick(menu);
    }
  };

  const handleSubMenuClick = (menu: any) => {
    setActiveSubMenuId(menu.id);
    setIsSidebarOpen(false);
    
    // Find the first terminal child if this menu still has children
    let terminalMenu = menu;
    while (terminalMenu.children && terminalMenu.children.length > 0) {
       const childId = terminalMenu.children[0];
       if (allMenus[childId]) {
         terminalMenu = allMenus[childId];
       } else {
         break;
       }
    }

    resolveAction(terminalMenu);
  };

  const handleDisconnect = () => {
    odooClient.clearConfig();
    setIsTerhubung(false);
  };

  const renderContent = () => {
    if (!isTerhubung || activeTopMenuId === 'settings') {
      return (
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div className="w-full max-w-2xl">
            <Settings onConnect={() => {
              setIsTerhubung(true);
              // loadMenus is called by useEffect on isTerhubung change
            }} />
          </div>
        </div>
      );
    }
    
    if (activeAction?.error) {
       return (
         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
           <AlertCircle className="w-16 h-16 mb-4 text-rose-300" />
           <h2 className="text-xl font-semibold text-slate-700 mb-2">No Records Found</h2>
           <p className="max-w-md bg-white border border-slate-200 shadow-sm p-4 rounded-lg text-sm">{activeAction.error}</p>
         </div>
       );
    }

    if (activeAction && activeAction.res_model) {
      return (
        <div className="flex-1 overflow-hidden relative">
           <DynamicListView action={activeAction} />
        </div>
      );
    }

    if (isResolving) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-10 h-10 mb-4 animate-spin text-indigo-400" />
          <p>Loading module...</p>
        </div>
      );
    }
    
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
        <LayoutGrid className="w-16 h-16 mb-4 text-slate-300" />
        <p>Select a module to view records</p>
      </div>
    );
  };

  // Get active children for sidebar
  let sidebarMenus: any[] = [];
  if (activeTopMenuId && activeTopMenuId !== 'settings' && allMenus[activeTopMenuId]) {
     const topMenu = allMenus[activeTopMenuId];
     if (topMenu.children && topMenu.children.length > 0) {
        sidebarMenus = topMenu.children.map((id: string | number) => allMenus[id]).filter(Boolean);
     }
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Topbar / App Drawer (Level 1) */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-20 relative">
        <div className="flex items-center gap-4 flex-1">
          <button 
            className="p-1.5 -ml-1.5 md:hidden rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 pr-6 border-r border-slate-200 mr-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <span className="text-white font-bold text-lg leading-none">O</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight tracking-tight hidden sm:block">Dynamic ERP</h1>
            </div>
          </div>

          {/* Horizontal root menus */}
          <div className="hidden md:flex flex-1 items-center gap-1 overflow-x-auto custom-scrollbar h-full py-2">
            {rootMenus.map(menu => (
              <button
                key={menu.id}
                onClick={() => handleTopMenuClick(menu)}
                className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTopMenuId === menu.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {menu.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4 pl-4 shrink-0">
          {isTerhubung && (
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-indigo-200"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Konsultan AI</span>
            </button>
          )}

          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full hidden sm:flex">

            <div className={`w-2 h-2 rounded-full ${isTerhubung ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isTerhubung ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isTerhubung ? 'Terhubung' : 'Terputus'}
            </span>
          </div>
          
          <div className="text-right hidden lg:block">
            <div className="text-[10px] text-slate-400 uppercase font-bold leading-none">API Latency</div>
            <div className="text-xs font-mono font-medium text-slate-600">{latency}ms</div>
          </div>
          
          {odooClient.getConfig().useMock && (
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold border border-purple-200">
              MOCK
            </span>
          )}
          
          {isTerhubung && !odooClient.getConfig().useMock && (
            <button 
              onClick={handleDisconnect}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded px-3 py-1 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Sidebar / Submenu (Level 2) */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 mt-14' : '-translate-x-full mt-14 md:mt-0'}
          ${(!sidebarMenus.length && activeTopMenuId !== 'settings') ? 'md:hidden' : ''}
        `}>
          <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-800">
             <span className="text-white font-bold tracking-tight">Menu</span>
             <button className="text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            {menuError ? (
              <div className="px-3 py-4 text-xs text-rose-400 text-center bg-rose-950/30 rounded-lg border border-rose-900/50 m-2">
                {menuError}
              </div>
            ) : loadingMenus ? (
              <div className="flex items-center justify-center py-8">
                 <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : sidebarMenus.length > 0 ? (
              <div className="px-2 space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 px-3 pt-2">
                  {allMenus[activeTopMenuId as number]?.name || 'Submenus'}
                </div>
                {sidebarMenus.map((mod: any) => (
                  <button
                    key={mod.id}
                    onClick={() => handleSubMenuClick(mod)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                      activeSubMenuId === mod.id
                          ? 'text-white bg-slate-800 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Package className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 shrink-0" />
                    <span className="text-sm font-medium tracking-wide truncate">{mod.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
            
            <div className="pt-4 mt-4 border-t border-slate-800 px-2 pb-4">
              <button
                onClick={() => {
                  setActiveTopMenuId('settings');
                  setActiveAction(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  activeTopMenuId === 'settings'
                      ? 'text-white bg-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <SettingsIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-400 shrink-0" />
                <span className="text-sm font-medium tracking-wide">Pengaturan Koneksi</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-3 h-3 text-slate-500" />
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Endpoint</div>
            </div>
            <div className="text-[11px] font-mono truncate text-indigo-400 opacity-80 hover:opacity-100 transition-opacity">
              {odooClient.getConfig().url || 'Not configured'}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
           {renderContent()}
        </section>
      </main>

      <footer className="h-8 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium shrink-0 relative z-10">
        <div className="flex gap-4">
          <span>DATABASE: <span className="text-slate-800 font-bold">{odooClient.getConfig().db || 'None'}</span></span>
          <span>USER: <span className="text-slate-800 font-bold">{odooClient.getConfig().username || 'None'}</span></span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isTerhubung ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> 
            RPC Status: {isTerhubung ? 'Active' : 'Inactive'}
          </span>
          <span>Asia/Jakarta (WIB)</span>
        </div>
      </footer>

      <AIConsultantModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onApplySuccess={() => {
          loadMenus();
        }} 
      />
    </div>
  );
}
