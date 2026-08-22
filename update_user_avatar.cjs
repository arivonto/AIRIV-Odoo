const fs = require('fs');
const path = 'src/components/UserProfile.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import { User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check, Camera } from "lucide-react";')) {
  code = code.replace(
    `import { User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check } from 'lucide-react';`,
    `import { User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check, Camera } from 'lucide-react';`
  );
}

// Insert upload handler and file input ref
code = code.replace(
  `  const [saving, setSaving] = useState(false);`,
  `  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).replace('data:', '').replace(/^.+,/, '');
        try {
          await odooService.writeRecord('res.partner', partnerData.id, { image_1920: base64String });
          setPartnerData({ ...partnerData, avatar_128: base64String });
        } catch (err: any) {
          const errMsg = err.message || 'Failed to update avatar';
          if (errMsg.includes("not allowed") || errMsg.includes("modify 'Contact'")) {
            setPartnerData({ ...partnerData, avatar_128: base64String });
            alert('Saved locally (Offline Fallback: Write access denied in Odoo)');
          } else {
            alert(errMsg);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };`
);

// Add Camera overlay and file input in the avatar rendering
code = code.replace(
  `                   <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-sm border border-slate-200">
                     {partnerData?.avatar_128 ? (
                       <img src={\`data:image/png;base64,\${partnerData.avatar_128}\`} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                     ) : (
                       <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center">
                         <User className="w-10 h-10 text-indigo-300" />
                       </div>
                     )}
                   </div>`,
  `                   <div className="relative group w-24 h-24 rounded-2xl bg-white p-1 shadow-sm border border-slate-200">
                     {partnerData?.avatar_128 ? (
                       <img src={\`data:image/png;base64,\${partnerData.avatar_128}\`} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                     ) : (
                       <div className="w-full h-full bg-indigo-50 rounded-xl flex items-center justify-center">
                         <User className="w-10 h-10 text-indigo-300" />
                       </div>
                     )}
                     <div 
                        className="absolute inset-1 rounded-xl bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                   </div>`
);

fs.writeFileSync(path, code);
