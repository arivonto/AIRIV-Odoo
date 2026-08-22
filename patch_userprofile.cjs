const fs = require('fs');

let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// 1. Add imports
if (!code.includes('performKtpOcr')) {
  code = code.replace(
    "import { odooService } from '../services/odoo';", 
    "import { odooService } from '../services/odoo';\nimport { performKtpOcr, getGeminiApiKey } from '../services/gemini';"
  );
}

// 2. Add state
const stateSearch = `const [idToast, setIdToast] = useState('');`;
const stateReplace = `const [idToast, setIdToast] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [pendingOcrImage, setPendingOcrImage] = useState<string | null>(null);`;
if (!code.includes('showApiKeyModal')) {
  code = code.replace(stateSearch, stateReplace);
}

// 3. Replace processIdImage
const processSearchRegex = /const processIdImage = async \(base64String: string\) => \{[\s\S]*?finally \{\s*setIsLoadingOCR\(false\);\s*\}\s*\};/m;
const processReplaceStr = `const processIdImage = async (base64String: string) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setPendingOcrImage(base64String);
      setShowApiKeyModal(true);
      return;
    }

    setScanStep('review');
    setIsLoadingOCR(true);
    setIdToast('');
    try {
      const data = await performKtpOcr(base64String);
      setFormData({
        name: data.name || '',
        nik: data.nik || '',
        street: data.address || '',
        subdistrict: [data.kel_desa, data.kecamatan].filter(Boolean).join(', '),
        city: data.city || '',
        province: data.province || '',
        occupation: data.occupation || ''
      });
    } catch (err: any) {
      console.error("OCR Error:", err);
      // Fallback: don't block user. Open review form with blank fields.
      setFormData({
        name: '',
        nik: '',
        street: '',
        subdistrict: '',
        city: '',
        province: '',
        occupation: ''
      });
      setIdToast(err.message || "OCR extraction unavailable.");
    } finally {
      setIsLoadingOCR(false);
    }
  };`;

code = code.replace(processSearchRegex, processReplaceStr);

// 4. Add the API Key Modal UI inside the ID Scan Modal
// Let's insert it before the closing </div> of the ID Scan modal content.
const idModalSearch = `             {/* Step 3: Review & Edit */}`;
const apiModalCode = `             {showApiKeyModal && (
               <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                 <Shield className="w-12 h-12 text-indigo-600 mb-4" />
                 <h4 className="text-lg font-semibold text-slate-800 mb-2">Enter Gemini API Key to enable instant AI OCR</h4>
                 <p className="text-sm text-slate-500 mb-6">Your key is stored locally and securely used for document extraction.</p>
                 <input 
                   type="password" 
                   value={apiKeyInput} 
                   onChange={(e) => setApiKeyInput(e.target.value)} 
                   placeholder="AIzaSy..." 
                   className="w-full max-w-sm px-4 py-3 mb-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center font-mono" 
                 />
                 <div className="flex gap-3">
                   <button 
                     onClick={() => {
                       setShowApiKeyModal(false);
                       setScanStep('review');
                     }} 
                     className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                   >
                     Skip OCR
                   </button>
                   <button 
                     onClick={() => {
                       if(apiKeyInput.trim()) {
                         localStorage.setItem('AIRIV_GEMINI_API_KEY', apiKeyInput.trim());
                         setShowApiKeyModal(false);
                         if(pendingOcrImage) {
                           processIdImage(pendingOcrImage);
                         }
                       }
                     }} 
                     className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
                   >
                     Save & Continue
                   </button>
                 </div>
               </div>
             )}

             {/* Step 3: Review & Edit */}`;

code = code.replace(idModalSearch, apiModalCode);

fs.writeFileSync('src/components/UserProfile.tsx', code);
console.log("UserProfile patched");
