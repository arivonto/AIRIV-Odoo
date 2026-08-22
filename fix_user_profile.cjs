const fs = require('fs');

let userProfileCode = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const oldProcessIdImage = `  const processIdImage = async (base64String: string) => {
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
  };`;

const newProcessIdImage = `  const processIdImage = async (base64String: string) => {
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

if(userProfileCode.includes(oldProcessIdImage)) {
  userProfileCode = userProfileCode.replace(oldProcessIdImage, newProcessIdImage);
  fs.writeFileSync('src/components/UserProfile.tsx', userProfileCode);
  console.log("Updated UserProfile.tsx");
} else {
  console.log("Could not find the function to replace.");
}
