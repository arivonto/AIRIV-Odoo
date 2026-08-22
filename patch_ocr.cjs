const fs = require('fs');

let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// 1. Add states
const statesSearch = `const [idImageBase64, setIdImageBase64] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>({});
  const [idSaving, setIdSaving] = useState(false);
  const [idToast, setIdToast] = useState('');`;

const statesReplace = `const [idImageBase64, setIdImageBase64] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    street: '',
    subdistrict: '',
    city: '',
    province: '',
    occupation: ''
  });
  const [isLoadingOCR, setIsLoadingOCR] = useState(false);
  const [idSaving, setIdSaving] = useState(false);
  const [idToast, setIdToast] = useState('');`;

code = code.replace(statesSearch, statesReplace);

// 2. processIdImage
const processSearch = `  const processIdImage = async (base64String: string) => {
    setScanStep('processing');
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64String })
      });
      if (!res.ok) throw new Error('OCR API failed');
      const data = await res.json();
      setOcrData(data);
      setScanStep('review');
    } catch (err: any) {
      console.error("OCR Fetch Error Details:", err);
      // Fallback: don't block user. Open review form with blank fields.
      setOcrData({});
      setIdToast("OCR extraction unavailable. Please enter details manually.");
      setTimeout(() => setIdToast(''), 4000);
      setScanStep('review');
    }
  };`;

const processReplace = `  const processIdImage = async (base64String: string) => {
    setScanStep('review');
    setIsLoadingOCR(true);
    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64String })
      });
      if (!res.ok) throw new Error('OCR API failed');
      const data = await res.json();
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
      setIdToast("OCR extraction unavailable. Please enter details manually.");
      setTimeout(() => setIdToast(''), 4000);
    } finally {
      setIsLoadingOCR(false);
    }
  };`;

code = code.replace(processSearch, processReplace);

// 3. submitIdVerification
const submitSearch = `      if (ocrData.province) {
        const states = await odooService.searchRead('res.country.state', [['name', 'ilike', ocrData.province]], ['id', 'name'], 1);
        if (states && states.length > 0) state_id = states[0].id;
      }
      
      // Default Indonesia
      const countries = await odooService.searchRead('res.country', [['code', '=', 'ID']], ['id', 'name'], 1);
      if (countries && countries.length > 0) country_id = countries[0].id;
      
      let base64Clean = idImageBase64 ? idImageBase64.replace(/^data:image\\/\\w+;base64,/, "") : "";

      const payload = {
        vat: ocrData.nik,
        name: ocrData.name,
        street: (ocrData.address || '') + (ocrData.rtrw ? ', RT/RW ' + ocrData.rtrw : ''),
        street2: (ocrData.kel_desa ? ocrData.kel_desa + ', ' : '') + (ocrData.kecamatan || ''),
        city: ocrData.city,
        state_id: state_id || undefined,
        country_id: country_id || undefined,
        function: ocrData.occupation || partnerData?.function,
        avatar_128: base64Clean || undefined
      };`;

const submitReplace = `      if (formData.province) {
        const states = await odooService.searchRead('res.country.state', [['name', 'ilike', formData.province]], ['id', 'name'], 1);
        if (states && states.length > 0) state_id = states[0].id;
      }
      
      // Default Indonesia
      const countries = await odooService.searchRead('res.country', [['code', '=', 'ID']], ['id', 'name'], 1);
      if (countries && countries.length > 0) country_id = countries[0].id;
      
      let base64Clean = idImageBase64 ? idImageBase64.replace(/^data:image\\/\\w+;base64,/, "") : "";

      const payload = {
        vat: formData.nik,
        name: formData.name,
        street: formData.street,
        street2: formData.subdistrict,
        city: formData.city,
        state_id: state_id || undefined,
        country_id: country_id || undefined,
        function: formData.occupation || partnerData?.function,
        avatar_128: base64Clean || undefined
      };`;

code = code.replace(submitSearch, submitReplace);

// 4. closeScanner
const closeSearch = `    setShowIdScanner(false);
    setScanStep('upload');
    setIdImageBase64(null);
    setOcrData({});`;
const closeReplace = `    setShowIdScanner(false);
    setScanStep('upload');
    setIdImageBase64(null);
    setFormData({
      name: '',
      nik: '',
      street: '',
      subdistrict: '',
      city: '',
      province: '',
      occupation: ''
    });
    setIsLoadingOCR(false);`;
code = code.replace(closeSearch, closeReplace);

// 5. Update UI
// Find the processing block and remove it
const processingBlock = `{scanStep === 'processing' && (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                     <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                     <h4 className="text-lg font-medium text-slate-800">Extracting Identity Details</h4>
                     <p className="text-slate-500 text-sm mt-1">Please wait while Gemini Flash reads your document...</p>
                   </div>
                 )}`;
code = code.replace(processingBlock, '');

// Now replace the review block
const oldReviewStart = `<h4 className="font-semibold text-slate-800 mb-3">Confirm Extracted Details</h4>
                       <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">`;

const newReviewStart = `<h4 className="font-semibold text-slate-800 mb-3">Confirm Extracted Details</h4>
                       <div className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {isLoadingOCR && (
                           <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl">
                             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                             <h4 className="text-base font-medium text-slate-800">Extracting ID details...</h4>
                           </div>
                         )}`;
code = code.replace(oldReviewStart, newReviewStart);

// Now replace the inputs
const oldInputs = `<div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Legal Name</label>
                           <input type="text" value={ocrData.name || ''} onChange={(e) => setOcrData({...ocrData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">ID / NIK Number</label>
                           <input type="text" value={ocrData.nik || ''} onChange={(e) => setOcrData({...ocrData, nik: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Street Address</label>
                           <input type="text" value={ocrData.address || ''} onChange={(e) => setOcrData({...ocrData, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">RT / RW</label>
                           <input type="text" value={ocrData.rtrw || ''} onChange={(e) => setOcrData({...ocrData, rtrw: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Kelurahan / Desa</label>
                           <input type="text" value={ocrData.kel_desa || ''} onChange={(e) => setOcrData({...ocrData, kel_desa: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Kecamatan</label>
                           <input type="text" value={ocrData.kecamatan || ''} onChange={(e) => setOcrData({...ocrData, kecamatan: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">City</label>
                           <input type="text" value={ocrData.city || ''} onChange={(e) => setOcrData({...ocrData, city: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Province</label>
                           <input type="text" value={ocrData.province || ''} onChange={(e) => setOcrData({...ocrData, province: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Occupation / Role</label>
                           <input type="text" value={ocrData.occupation || ''} onChange={(e) => setOcrData({...ocrData, occupation: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>`;

const newInputs = `<div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Legal Name</label>
                           <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Legal Name" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">ID / NIK Number</label>
                           <input type="text" value={formData.nik} onChange={(e) => setFormData({...formData, nik: e.target.value})} placeholder="NIK / ID Number" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Street Address</label>
                           <input type="text" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} placeholder="Street Address" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Subdistrict (Kel/Kec)</label>
                           <input type="text" value={formData.subdistrict} onChange={(e) => setFormData({...formData, subdistrict: e.target.value})} placeholder="Subdistrict / Kelurahan / Kecamatan" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">City</label>
                           <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="City" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Province</label>
                           <input type="text" value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} placeholder="Province" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>
                         <div className="sm:col-span-2">
                           <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Occupation / Role</label>
                           <input type="text" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} placeholder="Occupation" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" />
                         </div>`;

code = code.replace(oldInputs, newInputs);

fs.writeFileSync('src/components/UserProfile.tsx', code);
console.log("Updated UserProfile.tsx successfully");
