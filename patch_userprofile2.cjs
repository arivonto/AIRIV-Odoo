const fs = require('fs');

let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// Update import
code = code.replace(
  "import { performKtpOcr, getGeminiApiKey } from '../services/gemini';",
  "import { performKtpOcr, getGeminiApiKey, compressImage } from '../services/gemini';"
);

// Update handleIdUpload
const oldUpload = `  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImageBase64(reader.result as string);
        processIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };`;

const newUpload = `  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanStep('processing');
      setIsLoadingOCR(true);
      try {
        const compressedBase64 = await compressImage(file);
        setIdImageBase64(compressedBase64);
        processIdImage(compressedBase64);
      } catch (err) {
        console.error("Compression Error:", err);
        setIdToast("Failed to process image");
        setIsLoadingOCR(false);
      }
    }
  };`;

code = code.replace(oldUpload, newUpload);

fs.writeFileSync('src/components/UserProfile.tsx', code);
console.log("UserProfile updated");
