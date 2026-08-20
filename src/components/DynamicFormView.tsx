import React, { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { ChevronLeft, Save, Loader2, Search, Trash2 } from 'lucide-react';

interface DynamicFormViewProps {
  model: string;
  id: number | null; // null for create
  onClose: () => void;
}

export function DynamicFormView({ model, id, onClose }: DynamicFormViewProps) {
  const [fields, setFields] = useState<any>({});
  const [record, setRecord] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadForm();
  }, [model, id]);

  const loadForm = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Get field definitions
      let fieldsData: any = {};
      try {
        fieldsData = await odooClient.executeKw(model, 'fields_get', [], {
          attributes: ['string', 'type', 'selection', 'relation', 'required', 'readonly']
        });
      } catch (fErr: any) {
        console.warn(`fields_get failed for ${model}: ${fErr.message}.`);
        fieldsData = {
          id: { string: 'ID', type: 'integer', readonly: true },
          name: { string: 'Name', type: 'char' },
          display_name: { string: 'Display Name', type: 'char', readonly: true }
        };
      }
      setFields(fieldsData);

      // 2. Load record if editing
      if (id) {
        const fieldNames = Object.keys(fieldsData).filter(k => 
          !['message_follower_ids', 'message_ids'].includes(k) 
          && fieldsData[k].type !== 'binary'
          && fieldsData[k].type !== 'one2many'
          && fieldsData[k].type !== 'many2many'
        );
        
        const data = await odooClient.executeKw(model, 'search_read', [[['id', '=', id]]], {
          fields: fieldNames,
          limit: 1
        });
        
        if (data.length > 0) {
           // many2one comes as [id, name], we need the id for the form state
           const processedData = { ...data[0] };
           Object.keys(processedData).forEach(key => {
             if (fieldsData[key]?.type === 'many2one' && Array.isArray(processedData[key])) {
               processedData[key] = processedData[key][0];
             }
           });
           setRecord(processedData);
        } else {
           setError('Record not found.');
        }
      } else {
        setRecord({});
      }
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      if (msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('access error')) {
        setError('Access Denied: You do not have permission to view or edit this record.');
      } else {
        setError(msg);
      }
      return;
      setError(err.message || 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    setDeleting(true);
    setError('');
    try {
      await odooClient.unlink(model, id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data');
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Clean up empty relations or read-only fields
      const dataToSave = { ...record };
      Object.keys(dataToSave).forEach(key => {
        if (fields[key]?.readonly) {
          delete dataToSave[key];
        }
      });
      
      if (id) {
        await odooClient.executeKw(model, 'write', [[id], dataToSave]);
      } else {
        await odooClient.executeKw(model, 'create', [dataToSave]);
      }
      onClose();
    } catch (err: any) {
      const msg = err.message || 'Unknown error';
      if (msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes('access error')) {
        setError('Access Denied: You do not have permission to view or edit this record.');
      } else {
        setError(msg);
      }
      return;
      setError(err.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setRecord((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderFieldInput = (key: string, field: any) => {
    const value = record[key];

    if (field.readonly) {
      return (
        <input 
          type="text" 
          value={value === false || value === null ? '' : String(value)} 
          disabled 
          className="w-full p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-500 sm:text-sm"
        />
      );
    }

    switch (field.type) {
      case 'char':
      case 'text':
        return (
          <input 
            type="text" 
            value={value || ''}
            onChange={e => handleFieldChange(key, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required={field.required}
          />
        );
      case 'integer':
      case 'float':
      case 'monetary':
        return (
          <input 
            type="number" 
            value={value || ''}
            onChange={e => handleFieldChange(key, Number(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            required={field.required}
          />
        );
      case 'selection':
        return (
          <select 
            value={value || ''}
            onChange={e => handleFieldChange(key, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
            required={field.required}
          >
            <option value=""></option>
            {field.selection?.map((opt: [string, string]) => (
              <option key={opt[0]} value={opt[0]}>{opt[1]}</option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={!!value}
                onChange={e => handleFieldChange(key, e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${value ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>
        );
      case 'many2one':
        // For simplicity, a basic number input for relation ID since full searchable dropdown requires custom async component.
        // We can use a simple input for now.
        return (
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="number" 
              placeholder={`ID for ${field.relation}`}
              value={value || ''}
              onChange={e => handleFieldChange(key, Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        );
      case 'date':
      case 'datetime':
        return (
          <input 
            type={field.type === 'date' ? 'date' : 'datetime-local'}
            value={value ? new Date(value).toISOString().slice(0, field.type === 'date' ? 10 : 16) : ''}
            onChange={e => handleFieldChange(key, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        )
      default:
        return (
           <input 
            type="text" 
            value={value || ''}
            onChange={e => handleFieldChange(key, e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-lg shadow-sm border border-slate-200 m-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500">Memuat formulir...</p>
      </div>
    );
  }

  // Filter fields to show on form (avoid binary, one2many, many2many for basic dynamic form)
  const formFields = Object.keys(fields).filter(k => 
    !['message_follower_ids', 'message_ids', 'create_uid', 'create_date', 'write_uid', 'write_date'].includes(k)
    && fields[k].type !== 'binary'
    && fields[k].type !== 'one2many'
    && fields[k].type !== 'many2many'
  ).slice(0, 20); // show top 20 fields max to avoid massive forms

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 m-4">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md border border-slate-300 text-slate-600 hover:bg-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {id ? `Edit ${model.replace(/\./g, ' ')}` : `Buat ${model.replace(/\./g, ' ')}`}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {id && (
            <button 
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 font-medium text-sm transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span className="hidden sm:inline">Hapus</span>
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-4xl">
          {formFields.map(key => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                {fields[key].string || key}
                {fields[key].required && <span className="text-rose-500">*</span>}
                {fields[key].readonly && <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Hanya Baca</span>}
              </label>
              {renderFieldInput(key, fields[key])}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
