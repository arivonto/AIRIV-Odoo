import { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { Server, User, Key, Database, CheckCircle, XCircle } from 'lucide-react';

interface SettingsProps {
  onConnect: () => void;
}

export function Settings({ onConnect }: SettingsProps) {
  const [url, setUrl] = useState('');
  const [db, setDb] = useState('');
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useMock, setUseMock] = useState(true);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const config = odooClient.getConfig();
    setUrl(config.url || '');
    setDb(config.db || '');
    setUsername(config.username || '');
    setApiKey(config.apiKey || '');
    setUseMock(config.useMock ?? true);
  }, []);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    
    // Save current values to config before testing
    odooClient.saveConfig({ url, db, username, apiKey, useMock });
    
    try {
      const uid = await odooClient.authenticate(db, username, apiKey);
      if (uid) {
        setTestResult({ success: true, message: `Successfully connected! UID: ${uid}` });
        onConnect();
      } else {
        setTestResult({ success: false, message: 'Authentication failed. Please check credentials.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection error.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-6">
        <h2 className="text-xl font-semibold text-slate-800">Odoo JSON-RPC Configuration</h2>
        <p className="text-slate-500 text-sm mt-1">Connect your dashboard to an Odoo 18 Community backend.</p>
      </div>
      
      <form onSubmit={handleTestConnection} className="p-6 space-y-6">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <h3 className="font-medium text-slate-800">Use Mock Data</h3>
            <p className="text-sm text-slate-500">Enable to test UI without a real Odoo server</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="space-y-4 opacity-100 transition-opacity" style={{ opacity: useMock ? 0.6 : 1, pointerEvents: useMock ? 'none' : 'auto' }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Odoo API Endpoint</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Server className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="url"
                required={!useMock}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                placeholder="https://odoo-api.airiv.id"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Database Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Database className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required={!useMock}
                value={db}
                onChange={(e) => setDb(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                placeholder="odoo_db"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required={!useMock}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                  placeholder="admin@airiv.id"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API Key / Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required={!useMock}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                  placeholder="••••••••••••••••"
                />
              </div>
            </div>
          </div>
        </div>

        {testResult && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {testResult.success ? <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 mt-0.5 shrink-0" />}
            <div className="text-sm font-medium">{testResult.message}</div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={isTesting}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
          >
            {isTesting ? 'Testing Connection...' : 'Save & Test Connection'}
          </button>
        </div>
      </form>
    </div>
  );
}
