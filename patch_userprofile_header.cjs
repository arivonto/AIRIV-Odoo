const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const regex = /\{\/\* Header Banner \*\/\}[\s\S]*?\{\/\* Main Content Grid \*\/\}/;

const newHeader = `{/* Header Banner */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 shrink-0">
        <div className="h-28 sm:h-36 w-full rounded-t-2xl bg-gradient-to-r from-blue-600 to-indigo-700"></div>
        <div className="px-4 sm:px-6 pb-6 pt-0 bg-white dark:bg-slate-900 rounded-b-2xl border border-t-0 border-slate-200 dark:border-slate-800">
           <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
             {/* Left: Avatar + Details */}
             <div className="flex items-end gap-3 sm:gap-4">
               <div className="relative">
                 <div className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white dark:border-slate-900 shadow-md bg-slate-100">
                   {partnerData?.avatar_128 ? (
                     <img src={\`data:image/png;base64,\${partnerData.avatar_128}\`} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                   ) : (
                     <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center">
                       <User className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300" />
                     </div>
                   )}
                   <div 
                      className="absolute inset-0 rounded-xl bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                   >
                      <Camera className="w-6 h-6 text-white" />
                   </div>
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleAvatarUpload} 
                   />
                 </div>
                 <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
               </div>
               <div className="pb-1">
                 <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                   {userData?.name}
                 </h2>
                 <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                   {partnerData?.function ? partnerData.function : 'System User'} · {userData?.company_id ? userData.company_id[1] : 'AIRIV'}
                 </p>
               </div>
             </div>

             {/* Right: Action Buttons Group */}
             <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto shrink-0">
               <button
                 onClick={() => {
                    setScanStep('upload');
                    setIdImageBase64(null);
                    setFormData({ name: '', nik: '', street: '', subdistrict: '', city: '', province: '', occupation: '' });
                    setShowIdScanner(true);
                 }}
                 className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
               >
                 <Camera className="w-4 h-4"/>
                 <span>Scan ID / KTP</span>
               </button>

               <button
                 onClick={() => setEditBioOpen(true)}
                 className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition"
               >
                 <Edit3 className="w-4 h-4"/>
                 <span>Edit Bio</span>
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* Main Content Grid */}`;

code = code.replace(regex, newHeader);

// Now need to fix padding in the main content grid
code = code.replace(
  '<div className="max-w-5xl mx-auto px-8 sm:px-12 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">',
  '<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">'
);

fs.writeFileSync('src/components/UserProfile.tsx', code);
