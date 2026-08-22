const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X, Check } from 'lucide-react';`,
  `import { Search, Loader2, AlertCircle, Plus, Edit2, Trash2, X, Check, RefreshCw } from 'lucide-react';`
);

code = code.replace(
  `           <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
             <Plus className="w-4 h-4" />
             New
           </button>`,
  `           <button onClick={fetchRecords} disabled={loading} className="text-slate-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50">
             <RefreshCw className={\`w-5 h-5 \${loading ? 'animate-spin' : ''}\`} />
           </button>
           <button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
             <Plus className="w-4 h-4" />
             New
           </button>`
);

fs.writeFileSync(path, code);
