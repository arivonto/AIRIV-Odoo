const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// Find the index of '{showIdScanner && ('
const startIndex = code.indexOf('{showIdScanner && (');
// Find the index of '{/* Edit Bio Modal */}'
const endIndex = code.indexOf('{/* Edit Bio Modal */}');

const newModal = `{showIdScanner && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Auto-Fill Profile via ID Scan
                  </h3>
                  <button onClick={closeScanner} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-auto p-6">
                 {scanStep === 'upload' && (
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
                         ref={idInputRef} 
                         onChange={handleIdUpload}
                       />
                       <button 
                         onClick={() => idInputRef.current?.click()} 
                         className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
                       >
                         <Camera className="w-5 h-5" />
                         Scan ID / KTP
                       </button>
                     </div>
                   </div>
                 )}

                 {scanStep === 'processing' && (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                     <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                     <h4 className="text-lg font-medium text-slate-800">Extracting Identity Details</h4>
                     <p className="text-slate-500 text-sm mt-1">Please wait while Gemini Flash reads your document...</p>
                   </div>
                 )}

                 {scanStep === 'review' && (
                   <div className="flex flex-col md:flex-row gap-8">
                     <div className="w-full md:w-5/12 flex flex-col">
                       <h4 className="font-semibold text-slate-800 mb-3">ID Preview</h4>
                       {idImageBase64 && (
                         <div className="bg-slate-100 rounded-xl p-2 border border-slate-200">
                           <img src={idImageBase64} alt="ID Preview" className="w-full h-auto rounded-lg" />
                         </div>
                       )}
                       <button onClick={() => setScanStep('upload')} className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium self-center">
                         Retake Photo
                       </button>
                     </div>
                     
                     <div className="w-full md:w-7/12 flex flex-col">
                       <h4 className="font-semibold text-slate-800 mb-3">Confirm Extracted Details</h4>
                       <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="sm:col-span-2">
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
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
               
               {scanStep === 'review' && (
                 <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                    <button onClick={closeScanner} disabled={idSaving} className="px-5 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors">Cancel</button>
                    <button onClick={submitIdVerification} disabled={idSaving} className="px-5 py-2.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70">
                       {idSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                       {idSaving ? 'Saving...' : 'Save & Update Profile'}
                    </button>
                 </div>
               )}
            </div>
         </div>
      )}\n\n      `;

code = code.substring(0, startIndex) + newModal + code.substring(endIndex);
fs.writeFileSync('src/components/UserProfile.tsx', code);
