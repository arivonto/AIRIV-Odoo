import React from 'react';
import { 
  Building2, Users, Settings, Target, Calendar, 
  Dumbbell, Truck, Package, Map, Search, FileText,
  LogOut, Activity, UserCircle, ShieldAlert
} from 'lucide-react';

interface MenuOption {
  id: string;
  name: string;
  icon: React.ElementType;
  model: string;
  domain?: any[];
  fields?: string[];
}

export const getRoleMenus = (login: string): MenuOption[] => {
  const loginLower = (login || '').toLowerCase();
  
  const profileMenu: MenuOption = { 
    id: 'profile', 
    name: 'User Profile & Bio', 
    icon: UserCircle, 
    model: 'res.users' 
  };
  
  let roleMenus: MenuOption[] = [];

  if (loginLower.includes('sportacademy')) {
    roleMenus = [
      { id: 'students', name: 'Athletes & Students', icon: Users, model: 'res.partner', domain: [['category_id', '!=', false]] },
      { id: 'sessions', name: 'Training Sessions', icon: Calendar, model: 'calendar.event' },
      { id: 'programs', name: 'Programs & Memberships', icon: Dumbbell, model: 'product.template' }
    ];
  }
  else if (loginLower.includes('freightforwarder')) {
    roleMenus = [
      { id: 'shipments', name: 'Waybills & Shipments', icon: Package, model: 'stock.picking' },
      { id: 'clients', name: 'Logistics Clients', icon: Building2, model: 'res.partner' },
      { id: 'routes', name: 'Fleet Manifest', icon: Map, model: 'fleet.vehicle' }
    ];
  }
  else if (loginLower.includes('talentscout')) {
    roleMenus = [
      { id: 'prospects', name: 'Scouting Profiles', icon: Target, model: 'res.partner' },
      { id: 'reports', name: 'Scouting Templates', icon: FileText, model: 'survey.survey' },
      { id: 'evaluations', name: 'Scout Assessments', icon: Activity, model: 'survey.user_input' }
    ];
  }
  else {
    // Default / Super Admin
    roleMenus = [
      { id: 'governance', name: 'Governance Dashboard', icon: ShieldAlert, model: 'res.users' },
      { id: 'companies', name: 'Companies', icon: Building2, model: 'res.company' },
      { id: 'users', name: 'Users', icon: Users, model: 'res.users' },
      { id: 'modules', name: 'System Modules', icon: Settings, model: 'ir.module.module' }
    ];
  }
  
  return [profileMenu, ...roleMenus];
};

interface SidebarProps {
  session: any;
  activeMenu: string;
  onMenuSelect: (menu: MenuOption) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ session, activeMenu, onMenuSelect, onLogout, isOpen, onClose }: SidebarProps) {
  const menus = getRoleMenus(session.username);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:w-64`}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
             <Building2 className="w-5 h-5 text-white" />
           </div>
           Odoo <span className="text-indigo-400">Portal</span>
        </h2>
        <div className="mt-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
           Workspace
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = activeMenu === menu.id;
          return (
            <button
              key={menu.id}
              onClick={() => onMenuSelect(menu)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{menu.name}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-3 mb-4">
           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
             <span className="text-sm font-semibold text-slate-300">
                {session.username ? session.username.charAt(0).toUpperCase() : 'U'}
             </span>
           </div>
           <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{session.name || session.username}</p>
              <p className="text-xs text-slate-500 truncate">{session.username}</p>
           </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
      </div>
    </>
  );
}
