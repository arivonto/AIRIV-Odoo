const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const newStates = `  const idInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [showIdScanner, setShowIdScanner] = useState(false);
  const [scanStep, setScanStep] = useState<'upload' | 'camera' | 'processing' | 'review'>('upload');
  const [idImageBase64, setIdImageBase64] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<any>({});
  const [idSaving, setIdSaving] = useState(false);
  const [idToast, setIdToast] = useState('');

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

  const startCamera = async () => {
    setScanStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable.");
      setScanStep('upload');
    }
  };

  const captureCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg');
      
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());

      setIdImageBase64(base64);
      processIdImage(base64);
    }
  };

  const closeScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowIdScanner(false);
    setScanStep('upload');
    setIdImageBase64(null);
    setOcrData({});
  };

  const processIdImage = async (base64String: string) => {
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
      alert("Failed to extract ID details: " + err.message);
      setScanStep('upload');
    }
  };

  const submitIdVerification = async () => {
    setIdSaving(true);
    try {
      // Resolve province -> state_id
      let state_id = false;
      let country_id = false;
      
      if (ocrData.province) {
        const states = await odooService.searchRead('res.country.state', [['name', 'ilike', ocrData.province]], ['id', 'name'], 1);
        if (states && states.length > 0) state_id = states[0].id;
      }
      
      // Default Indonesia
      const countries = await odooService.searchRead('res.country', [['code', '=', 'ID']], ['id', 'name'], 1);
      if (countries && countries.length > 0) country_id = countries[0].id;
      
      let base64Clean = idImageBase64 ? idImageBase64.replace(/^data:image\\/\\w+;base64,/, "") : "";

      const payload = {
        vat: ocrData.id_number,
        name: ocrData.full_name,
        street: ocrData.address + (ocrData.rt_rw ? ', RT/RW ' + ocrData.rt_rw : ''),
        street2: (ocrData.kel_desa ? ocrData.kel_desa + ', ' : '') + (ocrData.kecamatan || ''),
        city: ocrData.city,
        state_id: state_id || undefined,
        country_id: country_id || undefined,
        function: ocrData.occupation || partnerData?.function,
        image_1920: base64Clean || undefined
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
`;

code = code.replace(
  /const fileInputRef = React\.useRef<HTMLInputElement>\(null\);/,
  newStates + '\n  const fileInputRef = React.useRef<HTMLInputElement>(null);'
);

fs.writeFileSync('src/components/UserProfile.tsx', code);
