const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  `import { 
  Building2, Users, Settings, Target, Calendar, 
  Dumbbell, Truck, Package, Map, Search, FileText,
  LogOut, Activity, UserCircle
} from 'lucide-react';`,
  `import { 
  Building2, Users, Settings, Target, Calendar, 
  Dumbbell, Truck, Package, Map, Search, FileText,
  LogOut, Activity, UserCircle, ShieldAlert
} from 'lucide-react';`
);

code = code.replace(
  `    // Default / Super Admin
    roleMenus = [
      { id: 'companies', name: 'Companies', icon: Building2, model: 'res.company' },
      { id: 'users', name: 'Users', icon: Users, model: 'res.users' },
      { id: 'modules', name: 'System Modules', icon: Settings, model: 'ir.module.module' }
    ];`,
  `    // Default / Super Admin
    roleMenus = [
      { id: 'governance', name: 'Governance Dashboard', icon: ShieldAlert, model: 'res.users' },
      { id: 'companies', name: 'Companies', icon: Building2, model: 'res.company' },
      { id: 'users', name: 'Users', icon: Users, model: 'res.users' },
      { id: 'modules', name: 'System Modules', icon: Settings, model: 'ir.module.module' }
    ];`
);

// Switch Company logic for Multi-Company Switcher? That might be best inside the SuperAdminDashboard itself, or globally.
// The prompt says "Provide a header dropdown allowing the Super Admin to switch active company_id context on the fly to inspect any tenant's data views in real time."
// If we put a header dropdown in the App layout or in the Sidebar.

fs.writeFileSync('src/components/Sidebar.tsx', code);
