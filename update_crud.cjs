const fs = require('fs');
const path = 'src/components/CrudView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `<button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
             <Plus className="w-4 h-4" />
             New
           </button>`,
  `<button onClick={() => alert('Demo Mode: Cannot create new records in this environment.')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
             <Plus className="w-4 h-4" />
             New
           </button>`
);

code = code.replace(
  `<button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors inline-block mr-2">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="text-rose-600 hover:text-rose-900 p-1 rounded hover:bg-rose-50 transition-colors inline-block">
                          <Trash2 className="w-4 h-4" />
                        </button>`,
  `<button onClick={() => alert('Demo Mode: Cannot edit records in this environment.')} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors inline-block mr-2">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => alert('Demo Mode: Cannot delete records in this environment.')} className="text-rose-600 hover:text-rose-900 p-1 rounded hover:bg-rose-50 transition-colors inline-block">
                          <Trash2 className="w-4 h-4" />
                        </button>`
);

fs.writeFileSync(path, code);
