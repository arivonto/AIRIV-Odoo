import React, { useState, useEffect } from 'react';
import { Settings } from './components/Settings';
import { DynamicListView } from './components/DynamicListView';
import { odooClient } from './services/odoo';
import { Menu, X, Settings as SettingsIcon, Loader2, Database, LayoutGrid, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [menus, setMenus] = useState<any[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [menuError, setMenuError] = useState('');
  
  const [activeMenuId, setActiveMenuId] = useState<number | 'settings' | null>('settings');
  const [activeAction, setActiveAction] = useState<any>(null); // Store the full action payload

  useEffect(() => {
    const config = odooClient.getConfig();
    if ((config.db && config.uid && config.apiKey) || config.useMock) {
      setIsConnected(true);
    }

    const interval = setInterval(() => {
      setLatency(odooClient.getLatency());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadMenus();
    } else {
      setMenus([]);
    }
  }, [isConnected]);

  const loadMenus = async () => {
    setLoadingMenus(true);
    setMenuError('');
    try {
      // Fetch menus that represent apps (often parent_id=false or has an action)
      // To ensure we get everything navigable, we fetch top-level menus
      const topMenus = await odooClient.executeKw('ir.ui.menu', 'search_read', [[['parent_id', '=', false]]], {
        fields: ['id', 'name', 'complete_name', 'action', 'child_id'],
        order: 'sequence'
      });
      
      const processedMenus = [];
      for (const menu of topMenus) {
        let finalAction = menu.action;
        let finalName = menu.name;
        
        // If no direct action, find the first child that has an action (recursively or just next level)
        if (!finalAction && menu.child_id && menu.child_id.length > 0) {
           const children = await odooClient.executeKw('ir.ui.menu', 'search_read', [[['id', 'in', menu.child_id], ['action', '!=', false]]], {
             fields: ['id', 'name', 'complete_name', 'action'],
             limit: 1,
             order: 'sequence'
           });
           if (children.length > 0) {
             finalAction = children[0].action;
             finalName = children[0].complete_name || children[0].name;
           }
        }

        processedMenus.push({
          id: menu.id,
          name: menu.name,
          complete_name: finalName,
          action: finalAction || null
        });
      }
      
      setMenus(processedMenus);
      
    } catch (err: any) {
      console.error("Failed to load menus:", err);
      const msg = err.message || 'Unknown error';
      if (msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('authentication')) {
         setMenuError("Access Denied: You do not have permission to read the menu registry.");
      } else {
         setMenuError(`Failed to load menus: ${msg}`);
      }
    } finally {
      setLoadingMenus(false);
    }
  };

  const handleDisconnect = () => {
    odooClient.clearConfig();
    setIsConnected(false);
    setActiveMenuId('settings');
    setActiveAction(null);
  };

  const handleMenuClick = async (menu: any) => {
    setActiveMenuId(menu.id);
    setIsSidebarOpen(false);
    setActiveAction(null); // Reset while loading

    if (!menu.action) {
       setActiveAction({ error: `The module "${menu.name}" does not have a direct entry action mapped in the UI. This usually implies it requires backend configuration or is a settings-only module.` });
       return;
    }

    const [actionType, actionId] = typeof menu.action === 'string' ? menu.action.split(',') : [null, null];
    
    if (actionType !== 'ir.actions.act_window' || !actionId) {
       setActiveAction({ error: `Unsupported action type: ${actionType}. Only window actions (ir.actions.act_window) are currently supported in this generic client.` });
       return;
    }

    try {
      // 1. Dynamic Action Resolution Pipeline
      const actionData = await odooClient.executeKw(actionType, 'search_read', [[['id', '=', parseInt(actionId)]]], {
        fields: ['name', 'res_model', 'domain', 'context', 'views'],
        limit: 1
      });

      if (actionData.length > 0) {
         setActiveAction(actionData[0]);
      } else {
         setActiveAction({ error: `Action ID ${actionId} could not be resolved or you lack access rights to read it.` });
      }
    } catch (e: any) {
       setActiveAction({ error: `Failed to resolve action: ${e.message}` });
    }
  };

  const renderContent = () => {
    if (!isConnected || activeMenuId === 'settings') {
      return (
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div className="w-full max-w-2xl"><Settings onConnect={() => setIsConnected(true)} /></div>
        </div>
      );
    }

    if (activeAction?.error) {
       return (
         <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
           <AlertCircle className="w-16 h-16 mb-4 text-rose-300" />
           <h2 className="text-xl font-semibold text-slate-700 mb-2">Module Not Supported</h2>
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

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        {activeMenuId && !activeAction && <Loader2 className="w-12 h-12 mb-4 text-indigo-400 animate-spin" />}
        {!activeMenuId && <LayoutGrid className="w-16 h-16 mb-4 text-slate-300" />}
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Welcome to Odoo</h2>
        <p className="max-w-md">Select an application from the sidebar to begin. The dashboard is fully dynamic and metadata-driven.</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 shadow-sm relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-slate-600 hover:text-slate-900" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">O18</span>
              </div>
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">Dynamic ERP</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isConnected ? 'text-emerald-700' : 'text-rose-700'}`}>
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase font-bold leading-none">API Latency</div>
            <div className="text-xs font-mono font-medium text-slate-600">{latency}ms</div>
          </div>
          
          {odooClient.getConfig().useMock && (
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold border border-purple-200">
              MOCK
            </span>
          )}
          
          {isConnected && !odooClient.getConfig().useMock && (
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
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 mt-14' : '-translate-x-full mt-14 md:mt-0'}
        `}>
          <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-800">
             <span className="text-white font-bold tracking-tight">Menu</span>
             <button className="text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Installed Apps
            </div>
            {isConnected && (
              <button 
                onClick={loadMenus} 
                disabled={loadingMenus}
                className="text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
                title="Refresh Modules"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMenus ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
            {menuError ? (
              <div className="px-3 py-4 text-xs text-rose-400 text-center bg-rose-950/30 rounded-lg border border-rose-900/50">
                {menuError}
              </div>
            ) : loadingMenus ? (
              <div className="flex items-center justify-center py-8">
                 <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : menus.length > 0 ? (
              menus.map((menu, index) => {
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500', 'bg-violet-500'];
                const dotColor = colors[index % colors.length];
                
                return (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuClick(menu)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                      activeMenuId === menu.id 
                         ? 'text-white bg-slate-800 shadow-sm' 
                         : 'hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-sm ${dotColor}`}></span>
                    <span className="text-sm font-medium tracking-wide truncate">{menu.name}</span>
                  </button>
                );
              })
            ) : (
              isConnected && (
                <div className="px-3 py-4 text-xs text-slate-500 text-center bg-slate-800/50 rounded-lg border border-slate-700">
                  No compatible modules found.
                </div>
              )
            )}
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveMenuId('settings');
                  setActiveAction(null);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  activeMenuId === 'settings' 
                     ? 'text-white bg-slate-800 shadow-sm' 
                     : 'hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <SettingsIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                <span className="text-sm font-medium tracking-wide">Connection Settings</span>
              </button>
            </div>
          </nav>
          
          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
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
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span> 
            RPC Status: {isConnected ? 'Active' : 'Inactive'}
          </span>
          <span>Asia/Jakarta (WIB)</span>
        </div>
      </footer>
    </div>
  );
}
