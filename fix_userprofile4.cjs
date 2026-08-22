const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const badBlock = `                 {scanStep === 'processing' && (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                     <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                     <h4 className="text-lg font-medium text-slate-800">Processing Document...</h4>
                     <p className="text-slate-500 text-sm mt-1">Compressing image and extracting details...</p>
                   </div>
                 )}`;

code = code.replace(badBlock, '');

const uploadBlockSearch = `                       </div>
                     </div>
                   </div>
                 )}`;
const processingBlockCorrect = `                       </div>
                     </div>
                   </div>
                 )}
                 {scanStep === 'processing' && (
                   <div className="py-20 flex flex-col items-center justify-center text-center">
                     <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                     <h4 className="text-lg font-medium text-slate-800">Processing Document...</h4>
                     <p className="text-slate-500 text-sm mt-1">Compressing image and extracting details...</p>
                   </div>
                 )}`;
code = code.replace(uploadBlockSearch, processingBlockCorrect);
fs.writeFileSync('src/components/UserProfile.tsx', code);
