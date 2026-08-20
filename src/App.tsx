import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FileText, Package, Settings as SettingsIcon, AlertCircle, Menu, X } from 'lucide-react';
import { odooClient } from './services/odoo';
import { CrmKanban } from './components/CrmKanban';
import { InvoiceList } from './components/InvoiceList';
import { Inventory } from './components/Inventory';
import { Settings } from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('crm');
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check initial connection status based on config
    const config = odooClient.getConfig();
    setIsConnected(!!config.uid || config.useMock === true);
    
    // Poll latency occasionally
    const interval = setInterval(() => {
      setLatency(odooClient.getLatency());
      const currentConfig = odooClient.getConfig();
      const hasAuth = !!currentConfig.uid || currentConfig.useMock === true;
      setIsConnected(hasAuth);
      
      if (!hasAuth) {
        setActiveTab('settings');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = () => {
    odooClient.clearConfig();
    setIsConnected(false);
    setActiveTab('settings');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'crm': return <CrmKanban />;
      case 'invoices': return (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto"><InvoiceList /></div>
        </div>
      );
      case 'inventory': return (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-7xl mx-auto"><Inventory /></div>
        </div>
      );
      case 'settings': return (
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div className="w-full max-w-2xl"><Settings onConnect={() => setIsConnected(true)} /></div>
        </div>
      );
      default: return <CrmKanban />;
    }
  };

  const navItems = [
    { id: 'crm', label: 'CRM Pipeline', icon: Users },
    { id: 'invoices', label: 'Invoicing & Billing', icon: FileText },
    { id: 'inventory', label: 'Inventory', icon: Package },
  ];

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
                <span className="text-white font-bold text-xs">AR</span>
              </div>
              <h1 className="font-bold text-lg tracking-tight hidden sm:block">AIRIV ERP</h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium border ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'border-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                {item.label}
              </button>
            ))}
            <button 
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded-md text-sm font-medium border ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'border-transparent text-slate-600 hover:bg-slate-100'}`}
              >
                Settings
            </button>
          </nav>
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
          fixed inset-y-0 left-0 z-50 w-52 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 mt-14' : '-translate-x-full mt-14 md:mt-0'}
        `}>
          <div className="p-4 flex items-center justify-between md:hidden border-b border-slate-800">
             <span className="text-white font-bold tracking-tight">Menu</span>
             <button className="text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 text-[10px] uppercase font-bold tracking-widest text-slate-500 hidden md:block">Odoo 18 Modules</div>
          
          <nav className="flex-1 px-2 space-y-1 md:mt-0 mt-4">
            {navItems.map((item, index) => {
              const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500'];
              const dotColor = colors[index % colors.length];
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                    activeTab === item.id 
                      ? 'text-white bg-slate-800' 
                      : 'hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-sm ${dotColor}`}></span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
            
            <button
                  onClick={() => {
                    setActiveTab('settings');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group mt-4 ${
                    activeTab === 'settings' 
                      ? 'text-white bg-slate-800' 
                      : 'hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-sm bg-slate-500`}></span>
                  <span className="text-sm font-medium">Settings</span>
            </button>
          </nav>

          <div className="p-4 mt-auto border-t border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 tracking-tighter">Endpoint</div>
            <div className="text-[11px] font-mono truncate text-indigo-400">{odooClient.getConfig().url || 'Not configured'}</div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-slate-100">
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
