import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check, Camera, UploadCloud, FileText } from 'lucide-react';
import { odooService } from '../services/odoo';
import { performKtpOcr, getGeminiApiKey } from '../services/gemini';

export function UserProfile({ session }: { session: any }) {
  const [userData, setUserData] = useState<any>(null);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editBioOpen, setEditBioOpen] = useState(false);
  const [bioText, setBioText] = useState('');
  const [saving, setSaving] = useState(false);
    const idInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showIdScanner, setShowIdScanner] = useState(false);
  const [scanStep, setScanStep] = useState<'upload' | 'camera' | 'processing' | 'review'>('upload');
  const [idImageBase64, setIdImageBase64] = useState<string | null>(null);
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
  const [idToast, setIdToast] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [pendingOcrImage, setPendingOcrImage] = useState<string | null>(null);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImageBase64(reader.result as string);
        processIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = () => {};
  const captureCamera = () => {};
  const closeScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowIdScanner(false);
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
    setIsLoadingOCR(false);
  };

  const processIdImage = async (base64String: string) => {
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
  };

  const submitIdVerification = async () => {
    setIdSaving(true);
    try {
      // Resolve province -> state_id
      let state_id = false;
      let country_id = false;
      
      if (formData.province) {
        const states = await odooService.searchRead('res.country.state', [['name', 'ilike', formData.province]], ['id', 'name'], 1);
        if (states && states.length > 0) state_id = states[0].id;
      }
      
      // Default Indonesia
      const countries = await odooService.searchRead('res.country', [['code', '=', 'ID']], ['id', 'name'], 1);
      if (countries && countries.length > 0) country_id = countries[0].id;
      
      let base64Clean = idImageBase64 ? idImageBase64.replace(/^data:image\/\w+;base64,/, "") : "";

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
      };

      await odooService.writeRecord('res.partner', partnerData.id, payload);
      setIdToast('Identity verified and profile updated successfully!');
      setTimeout(() => setIdToast(''), 4000);
      closeScanner();
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to update profile from ID verification');
    } finally {
      setIdSaving(false);
    }
  };

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
               <div className="mb-1 flex items-center gap-3">
                  <button onClick={() => {
                     setScanStep('upload');
                     setIdImageBase64(null);
                     setFormData({ name: '', nik: '', street: '', subdistrict: '', city: '', province: '', occupation: '' });
                     setShowIdScanner(true);
                  }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                     <Camera className="w-4 h-4" />
                     Scan ID / KTP
                  </button>
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
      
      {/* Identity Scanner Modal */}
      {showIdScanner && (
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
                       <div className="relative bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                         {isLoadingOCR && (
                           <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl">
                             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                             <h4 className="text-base font-medium text-slate-800">Extracting ID details...</h4>
                           </div>
                         )}
                         <div className="sm:col-span-2">
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
      )}

{/* Edit Bio Modal */}
      
      {/* Identity Scanner Modal */}
      {idToast && (
        <div className={`fixed bottom-4 right-4 ${idToast.toLowerCase().includes('error') || idToast.toLowerCase().includes('failed') || idToast.toLowerCase().includes('unavailable') ? 'bg-red-600' : 'bg-emerald-600'} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[60]`}>
          {idToast.toLowerCase().includes('error') || idToast.toLowerCase().includes('failed') || idToast.toLowerCase().includes('unavailable') ? <Shield className="w-5 h-5" /> : <Check className="w-5 h-5" />}
          <p className="font-medium">{idToast}</p>
        </div>
      )}
    </div>
  );
}
