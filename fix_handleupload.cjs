const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

const oldCatch = `      } catch (err) {
        console.error("Compression Error:", err);
        setIdToast("Failed to process image");
        setIsLoadingOCR(false);
      }`;
const newCatch = `      } catch (err) {
        console.error("Compression Error:", err);
        setIdToast("Failed to process image");
        setIsLoadingOCR(false);
        setScanStep('upload');
      }`;

code = code.replace(oldCatch, newCatch);
fs.writeFileSync('src/components/UserProfile.tsx', code);
