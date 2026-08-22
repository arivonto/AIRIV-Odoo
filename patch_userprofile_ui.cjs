const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const uiCard = `
          {/* Identity Verification Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Identity Verification
               </h2>
               {partnerData?.vat ? (
                 <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                   <Check className="w-3 h-3" /> Verified
                 </span>
               ) : (
                 <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                   Pending Verification
                 </span>
               )}
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div>
                 <p className="font-medium text-slate-800 text-sm">National ID (KTP) / Passport</p>
                 <p className="text-xs text-slate-500 mt-0.5 max-w-xs">Upload or scan your ID card to automatically verify and complete your profile.</p>
                 {partnerData?.vat && (
                   <p className="text-xs font-medium text-slate-700 mt-2">ID Number: {partnerData.vat}</p>
                 )}
               </div>
               <button onClick={() => setShowIdScanner(true)} className="w-full sm:w-auto px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                 {partnerData?.vat ? 'Update ID' : 'Scan ID Now'}
               </button>
             </div>
          </div>
`;

code = code.replace(
  /\{renderHTML\(partnerData\?\.comment\)\}\n          <\/div>\n        <\/div>/,
  `{renderHTML(partnerData?.comment)}\n          </div>${uiCard}\n        </div>`
);

const scannerModal = `
      {/* Identity Scanner Modal */}
      {showIdScanner && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Identity Document Capture
                  </h3>
                  <button onClick={closeScanner} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="p-6">
                 {scanStep === 'upload' && (
                   <div className="flex flex-col gap-4">
                     <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                       <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                       <p className="text-sm font-medium text-slate-700 mb-1">Drag and drop your ID image here</p>
                       <p className="text-xs text-slate-500 mb-4">Supports JPG, PNG, WEBP (Max 5MB)</p>
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         ref={idInputRef} 
                         onChange={handleIdUpload}
                       />
                       <button 
                         onClick={() => idInputRef.current?.click()} 
                         className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition-colors"
                       >
                         Browse Files
                       </button>
                     </div>
                     <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                     </div>
                     <button 
                       onClick={startCamera} 
                       className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-medium transition-colors border border-indigo-100"
                     >
                       <Camera className="w-5 h-5" />
                       Capture via Camera
                     </button>
                   </div>
                 )}

                 {scanStep === 'camera' && (
                   <div className="flex flex-col items-center">
                     <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                       <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-xl pointer-events-none"></div>
                     </div>
                     <div className="mt-6 flex gap-3 w-full">
                       <button onClick={() => { setScanStep('upload'); closeScanner(); setShowIdScanner(true); }} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
                       <button onClick={captureCamera} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 transition-colors">
                         <Camera className="w-5 h-5" /> Capture Image
                       </button>
                     </div>
                   </div>
                 )}

                 {scanStep === 'processing' && (
                   <div className="py-12 flex flex-col items-center justify-center text-center">
                     <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                     <h4 className="text-lg font-medium text-slate-800">Extracting Identity Details</h4>
                     <p className="text-slate-500 text-sm mt-1">Our AI is reading your document...</p>
                   </div>
                 )}

                 {scanStep === 'review' && (
                   <div className="flex flex-col lg:flex-row gap-6">
                     <div className="w-full lg:w-1/3 flex flex-col items-center">
                       {idImageBase64 && (
                         <img src={idImageBase64} alt="ID Preview" className="w-full h-auto rounded-lg border border-slate-200 shadow-sm" />
                       )}
                       <button onClick={() => setScanStep('upload')} className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium">Scan Again</button>
                     </div>
                     <div className="w-full lg:w-2/3 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                       <h4 className="font-semibold text-slate-800 mb-2 border-b pb-2">Review Extracted Data</h4>
                       {Object.keys(ocrData).map(key => (
                         <div key={key}>
                           <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                             {key.replace(/_/g, ' ')}
                           </label>
                           <input 
                             type="text" 
                             value={ocrData[key] || ''} 
                             onChange={(e) => setOcrData({...ocrData, [key]: e.target.value})}
                             className="w-full px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                           />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
               
               {scanStep === 'review' && (
                 <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                    <button onClick={closeScanner} disabled={idSaving} className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                    <button onClick={submitIdVerification} disabled={idSaving} className="px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70">
                       {idSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                       {idSaving ? 'Updating...' : 'Verify & Update Profile'}
                    </button>
                 </div>
               )}
            </div>
         </div>
      )}
`;

code = code.replace(
  /\{editBioOpen && \(/,
  scannerModal + '\n      {editBioOpen && ('
);

// Add the toast
code = code.replace(
  /<\/div>\n  \);\n\}/,
  `
      {idToast && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[60]">
          <Check className="w-5 h-5" />
          <p className="font-medium">{idToast}</p>
        </div>
      )}
    </div>
  );
}`
);

fs.writeFileSync('src/components/UserProfile.tsx', code);
