import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X, Check, RefreshCw } from 'lucide-react';
import { odooService } from '../services/odoo';

// Define form fields based on model/menu
const getFormConfig = (menuId: string, model: string) => {
  if (model === 'product.template') {
    return [
      { name: 'name', label: 'Package Name', type: 'text' },
      { name: 'list_price', label: 'Price (IDR)', type: 'number' },
    ];
  }
  if (model === 'res.partner') {
    if (menuId === 'students' || menuId === 'prospects') {
      return [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'comment', label: 'Bio / Notes', type: 'textarea' },
      ];
    } else {
      return [
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'phone', label: 'Phone', type: 'text' },
        { name: 'street', label: 'Street', type: 'text' },
        { name: 'city', label: 'City', type: 'text' },
      ];
    }
  }
  if (model === 'fleet.vehicle') {
    return [
      { name: 'license_plate', label: 'License Plate', type: 'text' },
    ];
  }
  if (model === 'survey.survey') {
    return [
      { name: 'title', label: 'Assessment Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ];
  }
  if (model === 'survey.user_input') {
    return [
      { name: 'survey_id', label: 'Survey ID', type: 'number' },
      { name: 'partner_id', label: 'Candidate (Partner ID)', type: 'number' },
      { name: 'scoring_total', label: 'Scoring Total (0-100)', type: 'number' },
    ];
  }
  return [{ name: 'name', label: 'Name', type: 'text' }];
};


interface CrudViewProps {
  menu: any;
  session?: any;
}

export const CrudView: React.FC<CrudViewProps> = ({ menu, session }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');


  
  
  const getMockData = (model: string) => {
    switch (model) {
      case 'product.template':
        return [
          { id: 1, name: 'Pro Athlete Membership (Monthly)', list_price: 1500000, qty_available: 50 },
          { id: 2, name: 'Youth Development Camp', list_price: 2500000, qty_available: 30 },
          { id: 3, name: '1-on-1 Coaching Session', list_price: 500000, qty_available: 100 }
        ];
      case 'calendar.event':
        return [
          { id: 1, name: 'U-19 Sprint Training', start: '2026-08-22 08:00:00', stop: '2026-08-22 10:00:00', duration: 2.0 },
          { id: 2, name: 'Endurance Assessment', start: '2026-08-23 14:00:00', stop: '2026-08-23 16:00:00', duration: 2.0 },
          { id: 3, name: 'Tactical Review', start: '2026-08-24 10:00:00', stop: '2026-08-24 11:30:00', duration: 1.5 }
        ];
      case 'survey.survey':
        return [
          { id: 1, title: 'Player Technical Evaluation - Q3', active: true, access_mode: 'public', description: 'Evaluate player technical skills', answer_count: 42, scoring_type: 'scoring_with_answers' },
          { id: 2, title: 'Pre-Season Fitness Survey', active: false, access_mode: 'token', description: 'Assess preseason physical conditioning', answer_count: 28, scoring_type: 'no_scoring' },
          { id: 3, title: 'Match Performance Review', active: true, access_mode: 'public', description: 'Post-match performance tracking', answer_count: 15, scoring_type: 'scoring_without_answers' }
        ];
      case 'survey.user_input':
        return [
          { id: 1, survey_id: [1, 'Player Technical Evaluation - Q3'], partner_id: [101, 'Budi Santoso'], scoring_total: 85, scoring_success: true, state: 'done', create_date: '2026-08-20 10:00:00' },
          { id: 2, survey_id: [2, 'Pre-Season Fitness Survey'], partner_id: [102, 'Siti Rahma'], scoring_total: 92, scoring_success: true, state: 'done', create_date: '2026-08-21 14:30:00' },
          { id: 3, survey_id: [1, 'Player Technical Evaluation - Q3'], partner_id: [103, 'CV Logistik Maju'], scoring_total: 45, scoring_success: false, state: 'in_progress', create_date: '2026-08-21 16:00:00' }
        ];
      case 'res.partner':
        return [
          { id: 101, name: 'Budi Santoso', email: 'budi.santoso@example.com', phone: '+628123456789', category_id: [1, 'Client'] },
          { id: 102, name: 'Siti Rahma', email: 'siti.rahma@example.com', phone: '+628987654321', category_id: [2, 'Supplier'] },
          { id: 103, name: 'CV Logistik Maju', email: 'contact@logistikmaju.co.id', phone: '+62214567890', category_id: [3, 'Partner'] }
        ];
      case 'stock.picking':
        return [
          { id: 1, name: 'WH/OUT/001', state: 'done', partner_id: [101, 'Budi Santoso'] },
          { id: 2, name: 'WH/OUT/002', state: 'assigned', partner_id: [102, 'Siti Rahma'] },
          { id: 3, name: 'WH/IN/001', state: 'draft', partner_id: [103, 'CV Logistik Maju'] }
        ];
      case 'fleet.vehicle':
        return [
          { id: 1, name: 'Truck A1', model_id: [1, 'Hino 500'], license_plate: 'B 1234 CD' },
          { id: 2, name: 'Van B2', model_id: [2, 'Toyota Hiace'], license_plate: 'D 5678 EF' },
          { id: 3, name: 'Truck C3', model_id: [3, 'Mitsubishi Fuso'], license_plate: 'L 9012 GH' }
        ];
      default:
        return [
          { id: 1, display_name: 'Mock Record 1', name: 'Mock Record 1' },
          { id: 2, display_name: 'Mock Record 2', name: 'Mock Record 2' }
        ];
    }
  };

  const getFieldsForModel = (model: string) => {
     switch (model) {
        case 'res.company': return ['id', 'name', 'currency_id', 'partner_id'];
        case 'res.users': return ['id', 'name', 'login', 'company_id', 'active'];
        case 'ir.module.module': return ['id', 'name', 'state', 'category_id'];
        case 'res.partner': return ['id', 'name', 'email', 'phone', 'category_id'];
        case 'calendar.event': return ['id', 'name', 'start', 'stop', 'duration'];
        case 'product.template': return ['id', 'name', 'list_price', 'qty_available'];
        case 'stock.picking': return ['id', 'name', 'state', 'partner_id'];
        case 'fleet.vehicle': return ['id', 'name', 'model_id', 'license_plate'];
        case 'survey.survey': return ['id', 'title', 'active', 'access_mode', 'description', 'answer_count', 'scoring_type'];
        case 'survey.user_input': return ['id', 'survey_id', 'partner_id', 'scoring_total', 'scoring_success', 'state', 'create_date'];
        default: return ['id', 'display_name', 'name'];
     }
  };

  const fields = getFieldsForModel(menu.model);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const domain = menu.domain ? [...menu.domain] : [];
      
      // Multi-tenant context filter
      if (session?.company_id && session.company_id[0] && !['survey.survey', 'survey.user_input', 'res.users', 'ir.module.module', 'res.company', 'calendar.event'].includes(menu.model)) {
         domain.push(['company_id', '=', session.company_id[0]]);
      }
      if (search) {
         if (menu.model === 'survey.survey') {
            domain.push(['title', 'ilike', search]);
         } else if (menu.model === 'survey.user_input') {
            // Fallback for user_input
            domain.push(['survey_id', 'ilike', search]);
         } else {
            domain.push(['name', 'ilike', search]);
         }
      }
      const data = await odooService.searchRead(menu.model, domain, fields, 50);
      setRecords(data);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to fetch records';
      setError(errMsg);
      
      // Graceful offline fallback for missing models or access denied
      if (errMsg.includes("doesn't exist") || errMsg.includes("not allowed") || errMsg.includes("Access Denied") || errMsg.includes("HTTP Error")) {
        setRecords(getMockData(menu.model));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [menu.model, search]);

  const handleOpenModal = (record: any = null) => {
    setFormError('');
    if (record) {
      setEditingRecord(record);
      // Pre-fill form data (un-tuple many2one fields)
      const data = { ...record };
      for (const key in data) {
        if (Array.isArray(data[key])) {
          data[key] = data[key][0]; // Take ID
        }
      }
      setFormData(data);
    } else {
      setEditingRecord(null);
      setFormData({});
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await odooService.unlinkRecord(menu.model, deleteConfirmId);
      fetchRecords();
      setToastMessage('Record deleted successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');
    try {
      const payload = { ...formData };
      
      // Data transformations based on model
      if (menu.model === 'product.template' && !editingRecord) {
        payload.type = 'service';
      }
      if (menu.model === 'survey.survey' && !editingRecord) {
        payload.active = true;
        payload.access_mode = 'public';
      }
      if (menu.model === 'survey.user_input' && !editingRecord) {
        payload.state = 'done';
      }

      if (session?.company_id && session.company_id[0] && !editingRecord) {
        if (['product.template', 'res.partner', 'fleet.vehicle'].includes(menu.model)) {
          payload.company_id = session.company_id[0];
        }
      }
      
      if (editingRecord) {
        await odooService.writeRecord(menu.model, editingRecord.id, payload);
      } else {
        await odooService.createRecord(menu.model, payload);
      }
      setIsModalOpen(false);
      fetchRecords();
      setToastMessage(editingRecord ? 'Record updated successfully!' : 'Record created successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };


  const renderValue = (val: any) => {
    if (val === false || val === null || val === undefined) return '-';
    if (Array.isArray(val) && val.length === 2) return val[1]; 
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold text-slate-800">{menu.name}</h1>
           <p className="text-sm text-slate-500 mt-1">{menu.model}</p>
         </div>
         <div className="flex items-center gap-4">
           <div className="relative">
             <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
             <input
               type="text"
               placeholder="Search..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-shadow shadow-sm"
             />
           </div>
           <button onClick={fetchRecords} disabled={loading} className="text-slate-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50">
             <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
           </button>
           <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
             <Plus className="w-4 h-4" />
             New
           </button>
         </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${records.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider mb-1">
                {records.length > 0 ? 'Offline Fallback Active' : 'Error'}
              </p>
              <p className="text-sm">{error}</p>
              {records.length > 0 && <p className="text-xs mt-1 opacity-80">Displaying realistic mock data because the Odoo module is missing or access was denied.</p>}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
             <p>Loading {menu.name}...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
             <p className="text-lg font-medium text-slate-600 mb-1">No records found</p>
             <p className="text-sm">Try adjusting your search or create a new record.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    {fields.map(f => (
                      <th key={f} className="px-6 py-3 font-medium capitalize tracking-wide">
                        {f.replace('_id', '').replace('_', ' ')}
                      </th>
                    ))}
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      {fields.map(f => (
                        <td key={f} className="px-6 py-4 text-slate-700">
                          {renderValue(record[f])}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(record)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors inline-block mr-2">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="text-rose-600 hover:text-rose-900 p-1 rounded hover:bg-rose-50 transition-colors inline-block">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <Check className="w-5 h-5" />
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Confirm Deletion</h2>
            </div>
            <div className="p-6 text-slate-600">
              Are you sure you want to delete this record? This action cannot be undone.
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">
                {editingRecord ? 'Edit Record' : 'New Record'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              {formError && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm flex items-start gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}
              <div className="space-y-4">
                {getFormConfig(menu.id, menu.model).map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        rows={3}
                        required={!editingRecord}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({...formData, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        required={!editingRecord}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRecord ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};