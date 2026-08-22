import React, { useState, useEffect } from 'react';
import { Users, Activity, Shield, Edit2, Trash2, Plus, Loader2, X, Check, Search, AlertCircle, Building2, UserCircle } from 'lucide-react';
import { odooService } from '../services/odoo';

export function SuperAdminDashboard({ session, companies }: { session: any, companies: any[] }) {
  const [activeTab, setActiveTab] = useState('monitor');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, logsData] = await Promise.all([
        odooService.searchRead('res.users', [], ['id', 'name', 'login', 'company_id', 'company_ids', 'groups_id', 'active', 'log_ids']),
        odooService.searchRead('res.users.log', [], ['id', 'create_uid', 'create_date'], 50)
      ]);
      setUsers(usersData);
      setLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch governance data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        login: user.login,
        company_id: user.company_id ? user.company_id[0] : companies[0]?.id,
        active: user.active
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        login: '',
        password: '',
        company_id: companies[0]?.id,
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name,
        login: formData.login,
        company_id: Number(formData.company_id),
        active: formData.active
      };

      if (editingUser) {
        await odooService.writeRecord('res.users', editingUser.id, payload);
      } else {
        payload.password = formData.password || 'password123';
        await odooService.createRecord('res.users', payload);
      }
      
      setToastMessage(editingUser ? 'User updated successfully' : 'User provisioned successfully');
      setTimeout(() => setToastMessage(''), 3000);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user: any) => {
    try {
      await odooService.writeRecord('res.users', user.id, { active: !user.active });
      setToastMessage(`User ${user.active ? 'suspended' : 'reactivated'} successfully`);
      setTimeout(() => setToastMessage(''), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <Check className="w-5 h-5" />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-500" />
            Governance Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">Super Admin activity monitoring and access control</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'monitor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Activity Monitor
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            User Management
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
             <p>Loading governance data...</p>
          </div>
        ) : activeTab === 'monitor' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-slate-800">Recent Login Sessions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Timestamp</th>
                    <th className="px-6 py-3 font-medium">User / Email</th>
                    <th className="px-6 py-3 font-medium">Tenant context</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map(log => {
                    const user = users.find(u => u.id === log.create_uid[0]);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{log.create_date}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3">
                          <UserCircle className="w-5 h-5 text-slate-400" />
                          <div>
                            <p>{log.create_uid[1]}</p>
                            <p className="text-xs text-slate-500 font-normal">{user?.login || 'Unknown'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                            <Building2 className="w-3.5 h-3.5" />
                            {user?.company_id ? user.company_id[1] : 'Global'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Online
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No recent activity logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Platform Users</h2>
              <button 
                onClick={() => handleOpenModal()} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Provision User
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <div key={user.id} className={`bg-white rounded-xl shadow-sm border ${!user.active ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'} overflow-hidden flex flex-col`}>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {user.name.charAt(0)}
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {user.active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{user.name}</h3>
                    <p className="text-sm text-slate-500 mb-4 line-clamp-1">{user.login}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{user.company_id ? user.company_id[1] : 'No Tenant Assigned'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{user.groups_id?.length > 15 ? 'Super Admin' : 'Standard User'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(user)}
                      className="flex-1 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => toggleUserStatus(user)}
                      className={`flex-1 border py-1.5 rounded-lg text-sm font-medium transition-colors ${user.active ? 'bg-white border-rose-200 hover:bg-rose-50 text-rose-600' : 'bg-white border-emerald-200 hover:bg-emerald-50 text-emerald-600'}`}
                    >
                      {user.active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editingUser ? 'Edit Permissions' : 'Provision User'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email / Login</label>
                  <input
                    type="email"
                    value={formData.login}
                    onChange={(e) => setFormData({...formData, login: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign Tenant (Company)</label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-2">
                   <label className="flex items-center gap-3 cursor-pointer group">
                     <div className="relative flex items-center">
                       <input 
                         type="checkbox" 
                         checked={formData.active}
                         onChange={(e) => setFormData({...formData, active: e.target.checked})}
                         className="sr-only peer"
                       />
                       <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                     </div>
                     <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                       Account Active
                     </span>
                   </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
