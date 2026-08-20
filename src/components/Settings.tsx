import { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { Server, User, Key, Database, CheckCircle, XCircle, LogOut, Eye, EyeOff, Settings2 } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, browserPopupRedirectResolver, User as FirebaseUser } from 'firebase/auth';

interface SettingsProps {
  onConnect: () => void;
}

export function Settings({ onConnect }: SettingsProps) {
  const [url, setUrl] = useState('');
  const [db, setDb] = useState('');
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useMock, setUseMock] = useState(true);
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);

  const loadCurrentConfig = () => {
    const config = odooClient.getConfig();
    setUrl(config.url || '');
    setDb(config.db || '');
    setUsername(config.username || '');
    setApiKey(config.apiKey || '');
    setUseMock(config.useMock ?? true);
  };

  useEffect(() => {
    loadCurrentConfig();
    const unsubscribe = auth.onAuthStateChanged(user => {
      setFbUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      const email = result.user.email;
      
      if (email === 'arivonto@gmail.com') {
        const autoConfig = {
          url: 'https://odoo-api.airiv.id',
          db: 'OdooAIRIV',
          username: email,
          apiKey: 'e5a2f2b715e1c0e07ad6850a0d6576d676737edd',
          useMock: false
        };
        
        setUrl(autoConfig.url);
        setDb(autoConfig.db);
        setUsername(autoConfig.username);
        setApiKey(autoConfig.apiKey);
        setUseMock(autoConfig.useMock);
        
        // Auto authenticate
        setIsTesting(true);
        odooClient.saveConfig(autoConfig);
        try {
          const uid = await odooClient.authenticate(autoConfig.db, autoConfig.username, autoConfig.apiKey);
          if (uid) {
            onConnect();
          } else {
            setTestResult({ success: false, message: 'Auto-authentication failed for this account.' });
            setShowManual(true);
          }
        } catch (err: any) {
          setTestResult({ success: false, message: err.message || 'Connection error during auto-login.' });
          setShowManual(true);
        } finally {
          setIsTesting(false);
        }
      } else {
        setTestResult({ success: false, message: 'Email not authorized for auto-provisioning. Please use manual configuration.' });
        setUsername(email || '');
        setShowManual(true);
      }
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain' || error.message.includes('requested action is invalid') || error.code === 'auth/invalid-action-code') {
         setTestResult({ 
           success: false, 
           message: `Firebase Domain Error: Please add '${window.location.hostname}' to the Authorized Domains list in your Firebase Console (Auth -> Settings -> Authorized Domains).` 
         });
      } else {
        setTestResult({ success: false, message: error.message || 'Google Sign-In failed.' });
      }
    }
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);
    
    // Save current values to config before testing
    odooClient.saveConfig({ url, db, username, apiKey, useMock });
    
    try {
      const uid = await odooClient.authenticate(db, username, apiKey);
      if (uid || useMock) {
        setTestResult({ success: true, message: `Successfully connected! ${uid ? 'UID: ' + uid : ''}` });
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

  const handleDisconnect = () => {
    odooClient.clearConfig();
    auth.signOut();
    loadCurrentConfig();
    setTestResult(null);
    setShowManual(false);
  };

  const config = odooClient.getConfig();
  const hasActiveSession = !!config.uid;

  return (
    <div className="max-w-2xl bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Welcome to Odoo Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Authenticate to connect to your ERP backend.</p>
        </div>
        {hasActiveSession && (
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-3 py-2 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        )}
      </div>
      
      <div className="p-6">
        {!hasActiveSession && !showManual && (
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <button
              onClick={handleGoogleSignIn}
              className="w-full max-w-sm flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-3 px-4 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              Sign in with Google
            </button>

            {testResult && (
              <div className={`p-4 rounded-lg flex items-start gap-3 w-full max-w-sm ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {testResult.success ? <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 mt-0.5 shrink-0" />}
                <div className="text-sm font-medium">{testResult.message}</div>
              </div>
            )}

            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => setShowManual(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              Manual Connection Settings
            </button>
          </div>
        )}

        {(showManual || hasActiveSession) && (
          <form onSubmit={handleTestConnection} className="space-y-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      type={showApiKey ? "text" : "password"}
                      required={!useMock}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                      placeholder="••••••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (!hasActiveSession) {
                    setShowManual(false);
                    setTestResult(null);
                  }
                }}
                className={`px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ${hasActiveSession ? 'hidden' : 'block'}`}
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
              >
                {isTesting ? 'Testing Connection...' : 'Save & Test Connection'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
