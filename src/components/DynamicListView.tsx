import React, { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { Search, ChevronLeft, ChevronRight, Plus, Loader2, AlertCircle } from 'lucide-react';
import { DynamicFormView } from './DynamicFormView';

interface DynamicListViewProps {
  action: any;
  onRecordSelected?: (id: number) => void;
}

export function DynamicListView({ action, onRecordSelected }: DynamicListViewProps) {
  const [fields, setFields] = useState<any>({});
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [metadataWarning, setMetadataWarning] = useState('');

  const limit = 20;
  const model = action.res_model;

  useEffect(() => {
    // Reset state when action changes
    setPage(1);
    setSearch('');
    setIsCreating(false);
    setSelectedRecordId(null);
  }, [action]);

  useEffect(() => {
    loadMetadataAndData();
  }, [action, page, search]);

  const loadMetadataAndData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch fields metadata safely
      let fieldsData: any = {};
      try {
        fieldsData = await odooClient.executeKw(model, 'fields_get', [], {
          attributes: ['string', 'type', 'selection', 'relation']
        });
      } catch (fErr: any) {
        console.warn(`fields_get failed for ${model}: ${fErr.message}.`);
        setMetadataWarning(`Metadata restricted for ${model}. Displaying basic fields.`);
        fieldsData = {
          id: { string: 'ID', type: 'integer' },
          name: { string: 'Name', type: 'char' },
          display_name: { string: 'Display Name', type: 'char' },
          create_date: { string: 'Created On', type: 'datetime' }
        };
      }
      
      setFields(fieldsData);
      
      // 2. Filter Fields (Resilient Schema Inspector)
      const priorityFields = ['name', 'display_name', 'state', 'date', 'user_id', 'partner_id', 'stage_id', 'amount_total'];
      
      const validFields = Object.entries(fieldsData)
        .filter(([k, v]: [string, any]) => 
           !['binary', 'many2many', 'one2many', 'html'].includes(v.type) && 
           !k.startsWith('message_') &&
           !k.startsWith('activity_')
        )
        .sort(([k1], [k2]) => {
          const p1 = priorityFields.includes(k1) ? 1 : 0;
          const p2 = priorityFields.includes(k2) ? 1 : 0;
          return p2 - p1;
        })
        .map(([k]) => k)
        .slice(0, 8); // top 8 fields max
      
      if (!validFields.includes('id')) validFields.unshift('id');
      if (fieldsData['display_name'] && !validFields.includes('display_name')) validFields.unshift('display_name');

      // 3. Build Domain safely (Combine action domain + search)
      let domain: any[] = [];
      
      // Try parsing action domain if it's a string, or use as is if it's an array
      if (action.domain) {
        if (Array.isArray(action.domain)) {
          domain = [...action.domain];
        } else if (typeof action.domain === 'string' && action.domain.trim().startsWith('[')) {
          try {
             // Basic JSON parse might fail on python tuples "[(...)]". 
             // We do a very naive conversion just for simple cases or ignore it if complex.
             const jsonDomainStr = action.domain.replace(/\(/g, '[').replace(/\)/g, ']').replace(/'/g, '"');
             domain = JSON.parse(jsonDomainStr);
          } catch (e) {
             console.warn("Could not parse Odoo domain string:", action.domain);
          }
        }
      }

      if (search) {
        domain.push(['display_name', 'ilike', search]);
      }

      // Parse context safely
      let parsedContext: any = {};
      if (action.context) {
        if (typeof action.context === 'object') {
           parsedContext = { ...action.context };
        } else if (typeof action.context === 'string' && action.context.trim().startsWith('{')) {
          try {
             const jsonContextStr = action.context.replace(/'/g, '"');
             parsedContext = JSON.parse(jsonContextStr);
          } catch (e) {
             console.warn("Could not parse Odoo context string:", action.context);
          }
        }
      }

      // 4. Fetch data
      // For immediate render, we request basic fields if validFields hasn't resolved correctly, 
      // but here validFields is fully resolved. Let's ensure limit is 50 for the first page as requested
      const fetchLimit = page === 1 ? 50 : limit;
      
      const data = await odooClient.executeKw(model, 'search_read', [domain.length ? domain : []], {
        fields: validFields.length > 0 ? validFields : ['id', 'display_name'],
        limit: fetchLimit,
        offset: (page - 1) * limit,
        context: parsedContext
      });
      
      setRecords(data);
    } catch (err: any) {
      console.warn(`Failed to fetch data for ${model}: ${err.message}`);
      setRecords([]); // Show clean empty state instead of error
    } finally {
      setLoading(false);
    }
  };

  const renderFieldValue = (field: any, value: any) => {
    if (value === false || value === null || value === undefined) return '-';
    
    switch (field.type) {
      case 'many2one':
        return Array.isArray(value) && value.length > 1 ? value[1] : value;
      case 'selection':
        const option = field.selection?.find((s: any) => s[0] === value);
        return option ? option[1] : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'monetary':
      case 'float':
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
      case 'datetime':
      case 'date':
         return new Date(value).toLocaleDateString('id-ID');
      default:
        return String(value);
    }
  };

  if (isCreating || selectedRecordId) {
    return (
      <DynamicFormView 
        model={model} 
        id={selectedRecordId}
        onClose={() => {
          setIsCreating(false);
          setSelectedRecordId(null);
          loadMetadataAndData(); // refresh
        }}
      />
    );
  }

  const columns = Object.keys(fields)
    .filter(k => records.length > 0 && records[0].hasOwnProperty(k) && k !== 'id')
    .slice(0, 7); // Max 7 columns

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 m-4">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {action.name || model.replace(/\./g, ' ')}
          </h2>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {model}
          </span>
        </div>
        
        {metadataWarning && (
           <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-medium">
             <AlertCircle className="w-3.5 h-3.5" />
             <span>{metadataWarning}</span>
           </div>
        )}
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadMetadataAndData()}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p>Loading records...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-600 p-8 text-center bg-rose-50/50">
            <AlertCircle className="w-12 h-12 mb-3 text-rose-400" />
            <p className="font-medium max-w-md">{error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center bg-slate-50/50">
             <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
               <Search className="w-8 h-8" />
             </div>
            <p className="font-semibold text-slate-600">No records found in this company / category</p>
            <p className="text-sm mt-1 mb-4 text-slate-500">Try clearing filters or checking your access rights.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-6 py-3 font-semibold whitespace-nowrap">{fields[col]?.string || col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(record => (
                <tr 
                  key={record.id} 
                  onClick={() => setSelectedRecordId(record.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {columns.map(col => (
                    <td key={col} className="px-6 py-3 text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                      {renderFieldValue(fields[col], record[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
        <span className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{records.length > 0 ? (page - 1) * limit + 1 : 0}</span> to <span className="font-medium text-slate-900">{(page - 1) * limit + records.length}</span> records
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded border border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 px-2">{page}</span>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={records.length < limit}
            className="p-1.5 rounded border border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
