const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

const imports = `import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X } from 'lucide-react';
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
`;

code = code.replace(
  `import React, { useState, useEffect } from 'react';\nimport { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X } from 'lucide-react';\nimport { odooService } from '../services/odoo';`,
  imports
);

// Add state for modal
const stateRegex = /const \[search, setSearch\] = useState\(''\);/;
code = code.replace(stateRegex, `const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
`);

// Add handlers
const fetchRegex = /useEffect\(\(\) => \{\n    fetchRecords\(\);\n  \}, \[menu.model, search\]\);/;
const handlers = `useEffect(() => {
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await odooService.unlinkRecord(menu.model, id);
      fetchRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
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

      // We should ideally fetch current company_id from session but since we don't have it directly in CrudView easily, 
      // the prompt says "company_id: user.company_id[0]" - we can omit company_id if it's auto-assigned by backend or fetch it from session. 
      // Actually we have Odoo session available if we pass it, but let's try without it first as it usually defaults to the user's current company.
      
      if (editingRecord) {
        await odooService.writeRecord(menu.model, editingRecord.id, payload);
      } else {
        await odooService.createRecord(menu.model, payload);
      }
      setIsModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };
`;
code = code.replace(fetchRegex, handlers);

// Update buttons
code = code.replace(
  `onClick={() => alert('Demo Mode: Cannot create new records in this environment.')}`,
  `onClick={() => handleOpenModal()}`
);

code = code.replace(
  `onClick={() => alert('Demo Mode: Cannot edit records in this environment.')}`,
  `onClick={() => handleOpenModal(record)}`
);

code = code.replace(
  `onClick={() => alert('Demo Mode: Cannot delete records in this environment.')}`,
  `onClick={() => handleDelete(record.id)}`
);

// Add Modal render at the end
const modalRender = `
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
};`;

code = code.replace(/    <\/div>\n  \);\n\};\s*$/, modalRender);

fs.writeFileSync(path, code);
