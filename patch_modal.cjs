const fs = require('fs');
let code = fs.readFileSync('src/components/AIConsultantModal.tsx', 'utf8');

code = code.replace(
  /"Hi! I'm your AI Business Consultant. Tell me a bit about your business, what you sell, and your main operational pain points, and I'll recommend the perfect Odoo module setup for you."/g,
  '"Halo! Saya Konsultan Bisnis AI Anda. Ceritakan sedikit tentang bisnis Anda, apa yang Anda jual, dan kendala operasional utama Anda, lalu saya akan merekomendasikan modul Odoo yang paling tepat untuk Anda."'
);

code = code.replace(/AI Business Consultant/g, 'Konsultan Bisnis AI');
code = code.replace(/Tailor your ERP setup instantly/g, 'Sesuaikan sistem ERP Anda secara instan');
code = code.replace(/Analyzing.../g, 'Menganalisis...');
code = code.replace(/Recommended Setup/g, 'Rekomendasi Modul');
code = code.replace(/Why this fits:/g, 'Mengapa ini cocok:');
code = code.replace(/Enable Modules/g, 'Aktifkan Modul');
code = code.replace(/Disable Modules/g, 'Nonaktifkan Modul');
code = code.replace(/None specified/g, 'Tidak ada');
code = code.replace(/Applying to Odoo.../g, 'Menerapkan ke Odoo...');
code = code.replace(/Apply Setup/g, 'Terapkan Modul');
code = code.replace(/Describe your business needs.../g, 'Ceritakan kebutuhan bisnis Anda...');

fs.writeFileSync('src/components/AIConsultantModal.tsx', code);
