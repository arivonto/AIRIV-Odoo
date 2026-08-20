import { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { User, Key, CheckCircle, XCircle, LogOut, Eye, EyeOff } from 'lucide-react';

interface SettingsProps {
  onConnect: () => void;
}

export function Settings({ onConnect }: SettingsProps) {
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  const loadCurrentConfig = () => {
    const config = odooClient.getConfig();
    setUsername(config.username || '');
    setApiKey(config.apiKey || '');
  };

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    
    // Hardcoded internal values
    const hardcodedDb = "OdooAIRIV";
    const hardcodedUrl = "https://odoo-api.airiv.id";
    const useMock = false;
    
    // Save current values to config before testing
    odooClient.saveConfig({ url: hardcodedUrl, db: hardcodedDb, username, apiKey, useMock });
    
    try {
      const authResult = await odooClient.authenticate(hardcodedDb, username, apiKey);
      if (authResult && authResult.uid) {
        setTestResult({ success: true, message: `Successfully connected! Welcome, ${authResult.name || username}` });
        onConnect();
      } else {
        setTestResult({ success: false, message: 'Authentication failed. Please check your credentials.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection error.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    odooClient.clearConfig();
    loadCurrentConfig();
    setTestResult(null);
  };

  const config = odooClient.getConfig();
  const hasActiveSession = !!config.uid;

  if (hasActiveSession) {
    return (
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">You are connected</h2>
            <p className="text-slate-500 text-sm mt-1">Logged in as {config.username}</p>
          </div>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-4 py-2 mt-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Odoo Login</h2>
        <p className="text-slate-500 text-sm mt-2">Sign in to your ERP workspace</p>
      </div>
      
      <div className="p-8">
        <form onSubmit={handleTestConnection} className="space-y-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email / Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white transition-shadow"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showApiKey ? "text" : "password"}
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="block w-full pl-11 pr-11 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white transition-shadow"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showApiKey ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
              {testResult.success ? <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 mt-0.5 shrink-0" />}
              <div className="text-sm font-medium">{testResult.message}</div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isTesting || !username || !apiKey}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTesting ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
