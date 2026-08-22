import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check, Camera } from 'lucide-react';
import { odooService } from '../services/odoo';

export function UserProfile({ session }: { session: any }) {
  const [userData, setUserData] = useState<any>(null);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editBioOpen, setEditBioOpen] = useState(false);
  const [bioText, setBioText] = useState('');
  const [saving, setSaving] = useState(false);
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
  };

  useEffect(() => {
    fetchProfile();
  }, [session.uid]);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch res.users
      const users = await odooService.searchRead(
        'res.users',
        [['id', '=', session.uid]],
        ['id', 'name', 'login', 'email', 'company_id', 'company_ids', 'partner_id', 'tz', 'lang'],
        1
      );
      if (!users || users.length === 0) throw new Error('User not found');
      const user = users[0];
      setUserData(user);

      // 2. Fetch res.partner
      if (user.partner_id && user.partner_id[0]) {
        const partners = await odooService.searchRead(
          'res.partner',
          [['id', '=', user.partner_id[0]]],
          ['phone', 'mobile', 'street', 'city', 'country_id', 'comment', 'function', 'title', 'avatar_128'],
          1
        );
        if (partners && partners.length > 0) {
          setPartnerData(partners[0]);
          setBioText(partners[0].comment || '');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    if (!partnerData?.id) return;
    setSaving(true);
    try {
      await odooService.writeRecord('res.partner', partnerData.id, { comment: bioText });
      setPartnerData({ ...partnerData, comment: bioText });
      setEditBioOpen(false);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to save bio';
      if (errMsg.includes("not allowed") || errMsg.includes("modify 'Contact'")) {
        // Graceful fallback for mock personas without write access
        setPartnerData({ ...partnerData, comment: bioText });
        setEditBioOpen(false);
        setError('Saved locally (Offline Fallback: Write access denied in Odoo)');
        setTimeout(() => setError(''), 5000);
      } else {
        setError(errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-500">Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full p-8">
        <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-200 text-center max-w-md">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-bold mb-2">Error Loading Profile</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const renderHTML = (htmlStr: string) => {
    // Basic detection if it's HTML, else render as pre-wrap
    if (htmlStr && (htmlStr.includes('<p>') || htmlStr.includes('<br'))) {
       return <div dangerouslySetInnerHTML={{ __html: htmlStr }} className="prose prose-sm prose-slate max-w-none text-slate-600" />;
    }
    return <div className="whitespace-pre-wrap text-slate-600 text-sm">{htmlStr || 'No bio provided.'}</div>;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-auto">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
         <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
         <div className="max-w-5xl mx-auto px-8 sm:px-12 pb-8">
            <div className="relative flex items-end justify-between mt-[-48px]">
               <div className="flex items-end gap-6">
                 <div className="relative">
                   <div className="relative group w-24 h-24 rounded-2xl bg-white p-1 shadow-sm border border-slate-200">
                     {partnerData?.avatar_128 ? (
                       <img src={`data:image/png;base64,${partnerData.avatar_128}`} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
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
                   </div>
                   <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                 </div>
                 <div className="mb-1">
                   <h1 className="text-2xl font-bold text-slate-800">{userData?.name}</h1>
                   <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
                     {partnerData?.function ? <span>{partnerData.function}</span> : <span>System User</span>}
                     {userData?.company_id && (
                       <>
                         <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                         <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building className="w-3.5 h-3.5" />
                            {userData.company_id[1]}
                         </span>
                       </>
                     )}
                   </div>
                 </div>
               </div>
               <div className="mb-1">
                  <button onClick={() => setEditBioOpen(true)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                     <Edit3 className="w-4 h-4" />
                     Edit Bio
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto px-8 sm:px-12 py-8 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Bio + Contact) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* About & Bio Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                About & Bio
             </h2>
             {renderHTML(partnerData?.comment)}
          </div>

        </div>

        {/* Right Column (Contact & Tenant Settings) */}
        <div className="space-y-8">
          
          {/* Contact & Localization */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Contact & Location</h2>
             <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                   <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                   <div>
                     <p className="font-medium text-slate-700">Email</p>
                     <p className="text-slate-500">{userData?.email || userData?.login || '-'}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                   <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                   <div>
                     <p className="font-medium text-slate-700">Phone / WhatsApp</p>
                     <p className="text-slate-500">{partnerData?.phone || partnerData?.mobile || '-'}</p>
                   </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                   <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                   <div>
                     <p className="font-medium text-slate-700">Office Location</p>
                     <p className="text-slate-500">
                       {[partnerData?.street, partnerData?.city, partnerData?.country_id?.[1]].filter(Boolean).join(', ') || '-'}
                     </p>
                   </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                   <Globe className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                   <div>
                     <p className="font-medium text-slate-700">Timezone & Lang</p>
                     <p className="text-slate-500">
                       {userData?.tz || 'System Default'} &middot; {userData?.lang || 'English'}
                     </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Tenant & Permissions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Tenant Scope
             </h2>
             <div className="space-y-4 text-sm">
               <div>
                  <p className="text-slate-500 mb-1">Active Company</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                     {userData?.company_id ? userData.company_id[1] : 'None'}
                  </p>
               </div>
               <div>
                  <p className="text-slate-500 mb-2">Allowed Companies</p>
                  <div className="flex flex-wrap gap-2">
                     {userData?.company_ids?.length > 0 ? (
                        userData.company_ids.map((id: number) => (
                           <span key={id} className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium">
                              ID: {id}
                           </span>
                        ))
                     ) : (
                        <span className="text-slate-400">-</span>
                     )}
                  </div>
               </div>
             </div>
          </div>

        </div>
      </div>

      {/* Edit Bio Modal */}
      {editBioOpen && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
               <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-indigo-500" /> Edit Bio
                  </h3>
                  <button onClick={() => setEditBioOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               <div className="p-6 flex-1 bg-white">
                  <textarea
                    className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-slate-700 text-sm"
                    placeholder="Write something about yourself..."
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-2">Supports plain text or Odoo HTML format.</p>
               </div>
               <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                  <button 
                    onClick={() => setEditBioOpen(false)} 
                    disabled={saving}
                    className="px-4 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                    onClick={handleSaveBio}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70"
                  >
                     {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                     {saving ? 'Saving...' : 'Save Changes'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
