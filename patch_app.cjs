const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldHeader = `<header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-white shrink-0 z-20 shadow-md">
            <div className="flex items-center gap-3">
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wide uppercase">Super Admin</span>
              <span className="text-sm text-slate-300">Global Governance Mode</span>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
              >`;

const newHeader = `<header className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-6 bg-slate-900 border-b border-slate-800 text-white shrink-0 z-20 shadow-md">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wide uppercase">Super Admin</span>
              <span className="text-sm text-slate-300 truncate">Global Governance Mode</span>
            </div>
            <div className="relative w-full sm:w-auto">
              <button 
                onClick={() => setShowCompanyMenu(!showCompanyMenu)}
                className="flex items-center justify-between w-full sm:w-auto gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
              >`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/App.tsx', code);
