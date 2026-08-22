const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');
code = code.replace(
  /<GoogleLogin\s+onSuccess=\{handleGoogleSuccess\}\s+onError=\{\(\) => setError\('Google Sign-In Failed'\)\}\s+\/>/m,
  `<GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign-In Failed')}
                use_fedcm_for_prompt={false}
              />`
);
fs.writeFileSync('src/components/Login.tsx', code);
