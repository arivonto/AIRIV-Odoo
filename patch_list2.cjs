const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

const targetLoad = `  const loadMetadataAndData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch fields metadata safely
      let fieldsData: any = {};
      try {
        fieldsData = await odooClient.executeKw(model, 'fields_get', [], {
          attributes: ['string', 'type', 'selection', 'relation']
        });
      } catch (fErr: any) {
        console.warn(\`fields_get failed for \${model}: \${fErr.message}.\`);
        setMetadataWarning(\`Metadata restricted for \${model}. Displaying basic fields.\`);
        fieldsData = {
          id: { string: 'ID', type: 'integer' },
          name: { string: 'Name', type: 'char' },
          display_name: { string: 'Display Name', type: 'char' },
          create_date: { string: 'Created On', type: 'datetime' }
        };
      }
      
      setFields(fieldsData);
      
      // 2. Filter Fields (Resilient Schema Inspector)
      const priorityFields = ['name', 'display_name', 'state', 'date', 'user_id', 'partner_id', 'stage_id', 'amount_total'];
      
      const validFields = Object.entries(fieldsData)
        .filter(([k, v]: [string, any]) => 
           !['binary', 'many2many', 'one2many', 'html'].includes(v.type) &&
           !k.startsWith('message_') && 
           !k.startsWith('activity_')
        )
        .sort(([k1], [k2]) => {
          const p1 = priorityFields.includes(k1) ? 1 : 0;
          const p2 = priorityFields.includes(k2) ? 1 : 0;
          return p2 - p1;
        })
        .map(([k]) => k)
        .slice(0, 8); // top 8 fields max
      
      if (!validFields.includes('id')) validFields.unshift('id');
      if (fieldsData['display_name'] && !validFields.includes('display_name')) validFields.unshift('display_name');`;

const replaceLoad = `  const loadMetadataAndData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fallback fields for immediate rendering
      const defaultFields = {
        id: { string: 'ID', type: 'integer' },
        display_name: { string: 'Display Name', type: 'char' },
        create_date: { string: 'Created On', type: 'datetime' },
        state: { string: 'Status', type: 'char' }
      };
      
      // 1. Fetch fields metadata safely in background, use default immediately if failed
      let fieldsData: any = {};
      let validFields = ['id', 'display_name', 'create_date', 'state'];
      
      try {
        fieldsData = await odooClient.executeKw(model, 'fields_get', [], {
          attributes: ['string', 'type', 'selection', 'relation']
        });
        
        // 2. Filter Fields (Resilient Schema Inspector)
        const priorityFields = ['name', 'display_name', 'state', 'date', 'user_id', 'partner_id', 'stage_id', 'amount_total'];
        
        validFields = Object.entries(fieldsData)
          .filter(([k, v]: [string, any]) => 
             !['binary', 'many2many', 'one2many', 'html'].includes(v.type) &&
             !k.startsWith('message_') && 
             !k.startsWith('activity_')
          )
          .sort(([k1], [k2]) => {
            const p1 = priorityFields.includes(k1) ? 1 : 0;
            const p2 = priorityFields.includes(k2) ? 1 : 0;
            return p2 - p1;
          })
          .map(([k]) => k)
          .slice(0, 8); // top 8 fields max
          
        if (!validFields.includes('id')) validFields.unshift('id');
        if (fieldsData['display_name'] && !validFields.includes('display_name')) validFields.unshift('display_name');
        
      } catch (fErr: any) {
        console.warn(\`fields_get failed for \${model}: \${fErr.message}.\`);
        fieldsData = defaultFields;
      }
      
      setFields(fieldsData);`;

code = code.replace(targetLoad, replaceLoad);
fs.writeFileSync('src/components/DynamicListView.tsx', code);
