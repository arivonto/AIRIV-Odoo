import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, CheckCircle, XCircle, LayoutGrid, Loader2 } from 'lucide-react';
import { odooClient } from '../services/odoo';

interface AIConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySuccess: () => void;
}

type Message = {
  role: 'user' | 'model';
  content: string;
};

type Recommendation = {
  profileName: string;
  modulesToActivate: { name: string; xmlId: string }[];
  modulesToDeactivate: { name: string; xmlId: string }[];
  reasoning: string;
};

export function AIConsultantModal({ isOpen, onClose, onApplySuccess }: AIConsultantModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Halo! Saya Konsultan Bisnis AI Anda. Ceritakan sedikit tentang bisnis Anda, apa yang Anda jual, dan kendala operasional utama Anda, lalu saya akan merekomendasikan modul Odoo yang paling tepat untuk Anda." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, recommendation]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Build conversation history for the API
      const conversationContext = messages.map(msg => {
         // Transform 'model' role to 'model' for Gemini, 'user' for 'user'
         return {
           role: msg.role === 'user' ? 'user' : 'model',
           parts: [{ text: msg.content }]
         };
      });
      
      conversationContext.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const response = await fetch('/api/consultant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: conversationContext })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message || 'Failed to communicate with AI');
      
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      
      if (data.profileName && (data.modulesToActivate?.length > 0 || data.modulesToDeactivate?.length > 0)) {
        setRecommendation({
          profileName: data.profileName,
          modulesToActivate: data.modulesToActivate || [],
          modulesToDeactivate: data.modulesToDeactivate || [],
          reasoning: data.reasoning
        });
      } else {
        setRecommendation(null);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to get recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySetup = async () => {
    if (!recommendation) return;
    
    setIsApplying(true);
    setError('');
    
    try {
      const xmlIds = recommendation.modulesToActivate.map(m => m.xmlId);
      if (xmlIds.length === 0) {
         throw new Error("No modules to activate.");
      }
      
      await odooClient.updateUserGroups(xmlIds);
      onApplySuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply setup in Odoo');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Konsultan Bisnis AI</h2>
              <p className="text-sm text-slate-500">Sesuaikan sistem ERP Anda secara instan</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10 rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-2 text-slate-500 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-sm font-medium">Menganalisis...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex gap-2">
              <XCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Recommendation Card */}
          {recommendation && !isLoading && (
            <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <LayoutGrid className="w-5 h-5 opacity-80" />
                  <span className="text-sm font-medium text-emerald-50 tracking-wider uppercase">Rekomendasi Modul</span>
                </div>
                <h3 className="text-xl font-bold">{recommendation.profileName}</h3>
              </div>
              
              <div className="p-6">
                <p className="text-slate-600 text-sm mb-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-700 block mb-1">Mengapa ini cocok:</span>
                  {recommendation.reasoning}
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Aktifkan Modul
                    </h4>
                    <div className="space-y-2">
                      {recommendation.modulesToActivate.map((mod, i) => (
                        <div key={i} className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 px-3 py-2 rounded-lg text-sm text-emerald-800 font-medium">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          {mod.name}
                        </div>
                      ))}
                      {recommendation.modulesToActivate.length === 0 && (
                         <p className="text-sm text-slate-400 italic">Tidak ada</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-slate-400" /> Nonaktifkan Modul
                    </h4>
                    <div className="space-y-2">
                      {recommendation.modulesToDeactivate.map((mod, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-sm text-slate-500">
                          <XCircle className="w-4 h-4 text-slate-300" />
                          {mod.name}
                        </div>
                      ))}
                      {recommendation.modulesToDeactivate.length === 0 && (
                         <p className="text-sm text-slate-400 italic">Tidak ada</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleApplySetup}
                    disabled={isApplying}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {isApplying ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Menerapkan ke Odoo...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Terapkan Modul</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ceritakan kebutuhan bisnis Anda..."
              disabled={isLoading || isApplying}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isApplying}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
