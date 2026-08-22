const fs = require('fs');
const path = 'src/components/UserProfile.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `      await odooService.writeRecord('res.partner', partnerData.id, { comment: bioText });
      setPartnerData({ ...partnerData, comment: bioText });
      setEditingBio(false);
      setError('');`,
  `      try {
        await odooService.writeRecord('res.partner', partnerData.id, { comment: bioText });
        setPartnerData({ ...partnerData, comment: bioText });
        setEditingBio(false);
        setError('');
      } catch (err: any) {
        const errMsg = err.message || 'Failed to save bio';
        if (errMsg.includes("not allowed") || errMsg.includes("modify 'Contact'")) {
          // Graceful fallback for mock personas without write access
          setPartnerData({ ...partnerData, comment: bioText });
          setEditingBio(false);
          setError('Saved locally (Offline Fallback: Write access denied in Odoo)');
          setTimeout(() => setError(''), 5000);
        } else {
          setError(errMsg);
        }
      }`
);

fs.writeFileSync(path, code);
