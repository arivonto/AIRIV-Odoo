const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

// Update imports
code = code.replace(
  "import { performKtpOcr, getGeminiApiKey, compressImage } from '../services/gemini';",
  "import { getGeminiApiKey, compressAndExtract } from '../services/gemini';"
);

code = code.replace(
  "const [pendingOcrImage, setPendingOcrImage] = useState<string | null>(null);",
  "const [pendingOcrFile, setPendingOcrFile] = useState<File | null>(null);"
);

// Replace handleIdUpload and processIdImage completely
const regexHandleUpload = /const handleIdUpload = async[\s\S]*?const submitIdVerification = async/;

const newMethods = `const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        setPendingOcrFile(file);
        setShowApiKeyModal(true);
        return;
      }
      await processIdFile(file, apiKey);
    }
  };

  const processIdFile = async (file: File | Blob, apiKey: string) => {
    setScanStep('processing');
    setIsLoadingOCR(true);
    setIdToast('');
    try {
      const { extracted, preview } = await compressAndExtract(file, apiKey);
      setIdImageBase64(preview);
      setScanStep('review');
      setFormData({
        name: extracted.name || '',
        nik: extracted.nik || '',
        street: extracted.address || '',
        subdistrict: [extracted.kel_desa, extracted.kecamatan].filter(Boolean).join(', '),
        city: extracted.city || '',
        province: extracted.province || '',
        occupation: extracted.occupation || ''
      });
    } catch (err: any) {
      console.error("OCR Error:", err);
      // Fallback: don't block user. Open review form with blank fields.
      setScanStep('review');
      setIdImageBase64(URL.createObjectURL(file));
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

  const submitIdVerification = async`;

code = code.replace(regexHandleUpload, newMethods);

// Update Modal continue button logic
const apiKeyModalRegex = /if\(pendingOcrImage\) \{\s*processIdImage\(pendingOcrImage\);\s*\}/;
const newApiKeyModalLogic = `if(pendingOcrFile) {
                           processIdFile(pendingOcrFile, apiKeyInput.trim());
                         }`;
code = code.replace(apiKeyModalRegex, newApiKeyModalLogic);

fs.writeFileSync('src/components/UserProfile.tsx', code);
