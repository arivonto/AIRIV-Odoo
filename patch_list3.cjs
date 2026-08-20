const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicListView.tsx', 'utf8');

const target = `      // 4. Fetch data
      const data = await odooClient.executeKw(model, 'search_read', [domain], {
        fields: validFields,
        limit,
        offset: (page - 1) * limit,
        context: parsedContext
      });
      
      setRecords(data);
    } catch (err: any) {`;

const replace = `      // 4. Fetch data
      // For immediate render, we request basic fields if validFields hasn't resolved correctly, 
      // but here validFields is fully resolved. Let's ensure limit is 50 for the first page as requested
      const fetchLimit = page === 1 ? 50 : limit;
      
      const data = await odooClient.executeKw(model, 'search_read', [domain.length ? domain : []], {
        fields: validFields.length > 0 ? validFields : ['id', 'display_name'],
        limit: fetchLimit,
        offset: (page - 1) * limit,
        context: parsedContext
      });
      
      setRecords(data);
    } catch (err: any) {`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/DynamicListView.tsx', code);
