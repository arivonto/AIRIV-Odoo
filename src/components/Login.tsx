import React, { useState } from 'react';
import { Database, User, Key, Loader2, AlertCircle, Dumbbell, Truck, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { odooService } from '../services/odoo';

export function Login({ onLogin }: { onLogin: (session: any) => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCustomLogin, setShowCustomLogin] = useState(false);

  const handleLoginSubmit = async (username: string, pass: string) => {
    setLoading(true);
    setError('');
    try {
      const session = await odooService.authenticate('OdooAIRIV', username, pass);
      onLogin(session);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoginSubmit(login, password);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError('');
      const decoded: any = jwtDecode(credentialResponse.credential);
      const email = decoded.email;
      
      if (email === 'arivonto@gmail.com') {
        // Elevate to Super Admin using internal admin credentials
        const session = await odooService.authenticate('OdooAIRIV', 'admin', 'admin');
        // Override session details with Google profile
        session.isSuperAdmin = true;
        session.username = email;
        session.name = decoded.name;
        session.picture = decoded.picture;
        onLogin(session);
      } else {
        // Fallback for others - we simulate matching or deny
        setError('Unauthorized: Google account not mapped to Odoo user.');
      }
    } catch (err: any) {
      setError('Google Sign-In Failed');
    } finally {
      setLoading(false);
    }
  };

  const quickAccessCards = [
    {
      title: 'Sport Academy',
      subtitle: 'Athlete training, schedules, and academy coaching',
      icon: Dumbbell,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      login: 'SportAcademy@odoo.airiv.id',
      pass: 'SAClient'
    },
    {
      title: 'Freight Forwarder',
      subtitle: 'Logistics tracking, shipments, and fleet management',
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      login: 'FreightForwarder@odoo.airiv.id',
      pass: 'FFClient'
    },
    {
      title: 'Talent Scout',
      subtitle: 'Player evaluations, metrics, and scout reports',
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      login: 'TalentScout@odoo.airiv.id',
      pass: 'TSClient'
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Brand / Welcome */}
        <div className="hidden md:block">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-6 shadow-lg shadow-indigo-200">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Odoo<span className="text-indigo-600">AIRIV</span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-md">
            A unified, multi-tenant workspace for specialized industry modules. Select a persona to continue.
          </p>
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             Connected to https://odoo-api.airiv.id
          </div>
        </div>

        {/* Right Side: Quick Access & Login */}
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200">
          
          <div className="md:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4 shadow-md shadow-indigo-200">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">OdooAIRIV</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Sign In</h2>
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In Failed')}
                use_fedcm_for_prompt={false}
              />
            </div>
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or use Quick Access</span>
              </div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Access</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 shadow-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            {quickAccessCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleLoginSubmit(card.login, card.pass)}
                  disabled={loading}
                  className="w-full text-left group bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100 rounded-xl p-4 transition-all flex items-start gap-4 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">{card.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <button 
              onClick={() => setShowCustomLogin(!showCustomLogin)}
              className="w-full flex items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Custom / Admin Login
              {showCustomLogin ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCustomLogin && (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email / Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 mt-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
