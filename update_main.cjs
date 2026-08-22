const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = code.replace(
  `import App from './App.tsx';`,
  `import App from './App.tsx';\nimport { GoogleOAuthProvider } from '@react-oauth/google';`
);
code = code.replace(
  `<App />`,
  `<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mock.apps.googleusercontent.com'}>\n      <App />\n    </GoogleOAuthProvider>`
);
fs.writeFileSync('src/main.tsx', code);
