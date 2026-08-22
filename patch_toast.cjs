const fs = require('fs');

let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const oldToast = `<div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[60]">
          <Check className="w-5 h-5" />`;

const newToast = `<div className={\`fixed bottom-4 right-4 \${idToast.toLowerCase().includes('error') || idToast.toLowerCase().includes('failed') || idToast.toLowerCase().includes('unavailable') ? 'bg-red-600' : 'bg-emerald-600'} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[60]\`}>
          {idToast.toLowerCase().includes('error') || idToast.toLowerCase().includes('failed') || idToast.toLowerCase().includes('unavailable') ? <Shield className="w-5 h-5" /> : <Check className="w-5 h-5" />}`;

code = code.replace(oldToast, newToast);

fs.writeFileSync('src/components/UserProfile.tsx', code);
console.log("Patched toast");
