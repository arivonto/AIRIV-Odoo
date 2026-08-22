const fs = require('fs');
let code = fs.readFileSync('src/components/UserProfile.tsx', 'utf8');

code = code.replace(
  /import \{ User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check, Camera \} from 'lucide-react';/,
  "import { User, Mail, Phone, MapPin, Globe, Building, Shield, Edit3, X, Loader2, Check, Camera, UploadCloud, FileText } from 'lucide-react';"
);

fs.writeFileSync('src/components/UserProfile.tsx', code);
