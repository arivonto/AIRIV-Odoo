const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const insertPoint = `  const submitIdVerification = async () => {`;
const insertContent = `  const closeScanner = () => {
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

  const submitIdVerification = async () => {`;

code = code.replace(insertPoint, insertContent);
fs.writeFileSync('src/components/UserProfile.tsx', code);
