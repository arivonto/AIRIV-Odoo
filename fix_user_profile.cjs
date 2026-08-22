const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// The first modal is at index 1, the second is around 508.
const firstModalIndex = code.indexOf('{showIdScanner && (');
const secondModalIndex = code.indexOf('{showIdScanner && (', firstModalIndex + 1);

if (secondModalIndex !== -1) {
  // Find where the second modal ends.
  // It ends right before the {idToast && (
  const endOfSecondModal = code.indexOf('{idToast && (', secondModalIndex);
  code = code.substring(0, secondModalIndex) + code.substring(endOfSecondModal);
}

// Add the second ref if missing
if (!code.includes('cameraInputRef = React.useRef')) {
  code = code.replace(
    'const idInputRef = React.useRef<HTMLInputElement>(null);',
    'const idInputRef = React.useRef<HTMLInputElement>(null);\n  const cameraInputRef = React.useRef<HTMLInputElement>(null);'
  );
}

// Update the upload step in the first modal
// The user wants:
// 1. "Browse Files" button -> idInputRef (no capture)
// 2. "Capture via Camera" button -> cameraInputRef (capture="environment")

const oldUploadBlockRegex = /\{scanStep === 'upload' && \([\s\S]*?\)\}/;

const newUploadBlock = `{scanStep === 'upload' && (
                   <div className="flex flex-col items-center justify-center py-12">
                     <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors max-w-lg w-full">
                       <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
                       <p className="text-base font-medium text-slate-700 mb-2">Upload or capture your ID</p>
                       <p className="text-sm text-slate-500 mb-6">Supports image files and mobile camera snapshot</p>
                       
                       <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment"
                         className="hidden" 
                         ref={cameraInputRef} 
                         onChange={handleIdUpload}
                       />
                       
                       <input 
                         type="file" 
                         accept="image/*,.pdf" 
                         className="hidden" 
                         ref={idInputRef} 
                         onChange={handleIdUpload}
                       />

                       <div className="flex flex-col sm:flex-row gap-4 w-full">
                         <button 
                           onClick={() => cameraInputRef.current?.click()} 
                           className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                         >
                           <Camera className="w-5 h-5" />
                           Capture via Camera
                         </button>

                         <button 
                           onClick={() => idInputRef.current?.click()} 
                           className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                         >
                           <UploadCloud className="w-5 h-5" />
                           Browse Files
                         </button>
                       </div>
                     </div>
                   </div>
                 )}`;

code = code.replace(oldUploadBlockRegex, newUploadBlock);

fs.writeFileSync('src/components/UserProfile.tsx', code);
console.log("Updated Profile Modal");
