import { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { CrmLead } from '../types';
import { formatIDR } from '../lib/utils';
import { Plus, GripVertical, Phone, Mail, X } from 'lucide-react';

const STAGES = [
  { id: 1, name: 'New', color: 'bg-slate-200 text-slate-700' },
  { id: 2, name: 'Qualified', color: 'bg-blue-100 text-blue-700' },
  { id: 3, name: 'Proposition', color: 'bg-purple-100 text-purple-700' },
  { id: 4, name: 'Won', color: 'bg-emerald-100 text-emerald-700' },
];

export function CrmKanban() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', expected_revenue: '', phone: '', email_from: '' });
  
  // Drag state
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await odooClient.getLeads();
      setLeads(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch CRM leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await odooClient.createLead({
        name: newLead.name,
        expected_revenue: Number(newLead.expected_revenue),
        phone: newLead.phone,
        email_from: newLead.email_from,
        stage_id: 1 // Default to New
      });
      setShowModal(false);
      setNewLead({ name: '', expected_revenue: '', phone: '', email_from: '' });
      fetchLeads();
    } catch (err) {
      alert('Failed to create lead');
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, stageId: number) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    const leadToUpdate = leads.find(l => l.id === draggedLeadId);
    if (!leadToUpdate || leadToUpdate.stage_id && leadToUpdate.stage_id[0] === stageId) {
      setDraggedLeadId(null);
      return;
    }

    const targetStage = STAGES.find(s => s.id === stageId);
    if (!targetStage) return;

    // Optimistic UI update
    setLeads(prev => prev.map(lead => 
      lead.id === draggedLeadId 
        ? { ...lead, stage_id: [stageId, targetStage.name] as [number, string] } 
        : lead
    ));

    try {
      await odooClient.updateLead(draggedLeadId, { stage_id: stageId });
    } catch (err) {
      // Revert on failure
      fetchLeads();
      alert('Failed to move lead');
    } finally {
      setDraggedLeadId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 h-[calc(100vh-140px)] animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 min-w-[300px] bg-slate-100/50 rounded-xl p-4 flex flex-col gap-4">
            <div className="h-6 w-24 bg-slate-200 rounded"></div>
            <div className="h-32 bg-white rounded-lg border border-slate-200"></div>
            <div className="h-32 bg-white rounded-lg border border-slate-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium text-rose-800 mb-2">Error Loading CRM</h3>
        <p className="text-rose-600 mb-4">{error}</p>
        <button onClick={fetchLeads} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold">CRM Pipeline</h2>
          <p className="text-xs text-slate-500">Managing odoo.airiv.id leads & opportunities</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors"
          >
            + New Opportunity
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-x-auto bg-slate-100">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(lead => {
            // Some leads might not have a stage_id set, default to New (id 1)
            const leadStageId = lead.stage_id ? lead.stage_id[0] : 1;
            return leadStageId === stage.id;
          });
          const totalRevenue = stageLeads.reduce((sum, lead) => sum + (lead.expected_revenue || 0), 0);

          return (
            <div 
              key={stage.id} 
              className="flex-1 flex flex-col gap-3 min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between px-1 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {stage.name} <span className={`ml-1 px-1.5 py-0.5 rounded ${stage.id === 4 ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>{stageLeads.length}</span>
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {formatIDR(totalRevenue)}
                </span>
              </div>
              
              <div className="flex flex-col gap-2 overflow-y-auto pb-4">
                {stageLeads.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-lg h-24 flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-medium italic">Drop here</span>
                  </div>
                ) : stageLeads.map(lead => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow transition-shadow cursor-grab active:cursor-grabbing group relative ${stage.id === 2 ? 'border-t-4 border-t-indigo-500 shadow-md' : ''} ${stage.id === 4 ? 'opacity-75' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-bold uppercase">Lead</span>
                      <span className="text-[10px] font-mono text-slate-400">#{lead.id}</span>
                    </div>
                    
                    <h4 className="text-sm font-bold truncate mb-1 pr-4">{lead.name}</h4>
                    <p className="text-xs text-slate-500 mb-3">{lead.partner_id ? lead.partner_id[1] : 'Unknown'}</p>

                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold ${stage.id === 4 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {formatIDR(lead.expected_revenue || 0)}
                      </span>
                      <span className={`text-[10px] font-bold ${stage.id === 4 ? 'text-emerald-600' : stage.id === 2 ? 'text-indigo-600' : 'text-slate-400 font-medium'}`}>
                        {stage.id === 4 ? 'DONE' : `${lead.probability}%`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-lg text-slate-800">New Opportunity</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Opportunity Title</label>
                <input required type="text" value={newLead.name} onChange={(e) => setNewLead({...newLead, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. ERP Implementation" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expected Revenue (IDR)</label>
                <input required type="number" value={newLead.expected_revenue} onChange={(e) => setNewLead({...newLead, expected_revenue: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="150000000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" value={newLead.phone} onChange={(e) => setNewLead({...newLead, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="0812..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={newLead.email_from} onChange={(e) => setNewLead({...newLead, email_from: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="email@example.com" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg shadow-sm transition-colors">Create Opportunity</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
