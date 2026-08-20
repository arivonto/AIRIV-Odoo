const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

const target = `            <p className="font-semibold text-slate-600">No records found in this company / category</p>
            <p className="text-sm mt-1">Try clearing filters or checking your access rights.</p>
          </div>`;

const replacement = `            <p className="font-semibold text-slate-600">No records found in this company / category</p>
            <p className="text-sm mt-1 mb-4 text-slate-500">Try clearing filters or checking your access rights.</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/DynamicListView.tsx', code);
