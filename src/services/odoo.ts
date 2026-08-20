export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  uid: number | null;
  session_id?: string | null;
  name?: string | null;
  company_id?: number | null;
}

class OdooClient {
  private config: OdooConfig = {
    url: '',
    db: '',
    username: '',
    apiKey: '',
    uid: null,
    session_id: null,
    name: null,
    company_id: null,
  };
  private latency: number = 0;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const defaultConfig = {
      url: 'https://odoo-api.airiv.id',
      db: 'OdooAIRIV',
      username: '',
      apiKey: '',
      uid: null,
      session_id: null,
      name: null,
      company_id: null,
    };
    const stored = localStorage.getItem('odoo_config');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.config = { ...defaultConfig, ...parsed };
        return;
      } catch (e) {
        console.error('Failed to parse config');
      }
    }
    this.config = defaultConfig;
  }

  saveConfig(newConfig: Partial<OdooConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('odoo_config', JSON.stringify(this.config));
  }

  clearConfig() {
    this.config = {
      url: 'https://odoo-api.airiv.id',
      db: 'OdooAIRIV',
      username: '',
      apiKey: '',
      uid: null,
      session_id: null,
      name: null,
      company_id: null,
    };
    localStorage.removeItem('odoo_config');
  }

  getConfig() {
    return this.config;
  }

  getLatency() {
    return this.latency;
  }

  async jsonRpc(service: string, method: string, args: any[]) {
    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL tidak dikonfigurasi');

    const endpoint = `${url}/jsonrpc`;
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        service,
        method,
        args,
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: "include",
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          
          
        },
        body: JSON.stringify(payload)
      });
      
      const endTime = performance.now();
      this.latency = Math.round(endTime - startTime);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Sesi telah berakhir. Silakan masuk kembali.');
        }
        if (response.status === 502) throw new Error('Koneksi ke server Odoo gagal (502 Bad Gateway). Server Odoo Anda sedang offline atau tidak dapat diakses.');
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseText = await response.text();
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
        throw new Error('Sesi autentikasi tidak valid atau telah berakhir.');
      }
      const data = JSON.parse(responseText);
      
      if (data.error) {
        if (data.error.data && data.error.data.message && data.error.data.message.includes('Session expired')) {
          this.clearConfig();
          throw new Error('Sesi telah berakhir. Silakan masuk kembali.');
        }
        throw new Error(data.error.data?.message || data.error.message || 'RPC Error occurred');
      }
      
      return data.result;
    } catch (err: any) {
      if (err.message.includes('Sesi telah berakhir')) {
        this.clearConfig();
      }
      throw err;
    }
  }

  async authenticate(db: string, username: string, apiKey: string) {
    const { url } = this.config;
    if (!url) throw new Error('Odoo URL tidak dikonfigurasi');

    const endpoint = `${url}/web/session/authenticate`;
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        db: db,
        login: username,
        password: apiKey
      },
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: "include",
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-odoo-url': url
        },
        body: JSON.stringify(payload)
      });
      
      const endTime = performance.now();
      this.latency = Math.round(endTime - startTime);

      if (!response.ok) {
        if (response.status === 502) throw new Error('Koneksi ke server Odoo gagal (502 Bad Gateway). Server Odoo Anda sedang offline atau tidak dapat diakses.');
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseText = await response.text();
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
        throw new Error('Sesi autentikasi tidak valid atau telah berakhir.');
      }
      const data = JSON.parse(responseText);
      
      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Autentikasi gagal.');
      }
      
      const result = data.result;
      
      if (!result || !result.uid) {
        throw new Error('Autentikasi gagal: Kredensial tidak valid (atau database OdooAIRIV tidak ditemukan).');
      }
      
      this.saveConfig({ 
        db, 
        username, 
        apiKey, 
        uid: result.uid,
        session_id: result.session_id,
        name: result.name,
        company_id: result.company_id
      });
      
      return result;
    } catch (err: any) {
      throw err;
    }
  }

  async executeKw(model: string, method: string, args: any[], kwargs: any = {}) {
    const { db, uid, apiKey } = this.config;
    if (!db || !uid || !apiKey) {
      throw new Error('Sesi telah berakhir. Silakan masuk kembali.');
    }
    
    return this.jsonRpc('object', 'execute_kw', [
      db,
      uid,
      apiKey,
      model,
      method,
      args,
      kwargs
    ]);
  }

  async loadMenus() {
    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL tidak dikonfigurasi');
    if (!session_id) throw new Error('Sesi tidak ditemukan, silakan masuk kembali.');

    const endpoint = `${url}/web/menu/load_menus`;
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: {},
      id: Math.floor(Math.random() * 1000000000),
    };

    const startTime = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: "include",
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          
          
        },
        body: JSON.stringify(payload)
      });
      
      const endTime = performance.now();
      this.latency = Math.round(endTime - startTime);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Sesi telah berakhir. Silakan masuk kembali.');
        }
        if (response.status === 502) throw new Error('Koneksi ke server Odoo gagal (502 Bad Gateway). Server Odoo Anda sedang offline atau tidak dapat diakses.');
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const responseText = await response.text();
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
        throw new Error('Sesi autentikasi tidak valid atau telah berakhir.');
      }
      const data = JSON.parse(responseText);
      
      if (data.error) {
        throw new Error(data.error.data?.message || data.error.message || 'Gagal memuat menu');
      }
      
      return data.result;
    } catch (err: any) {
      throw err;
    }
  }

  async loadAction(actionId: number) {
    const { url, session_id } = this.config;
    if (!url) throw new Error('Odoo URL tidak dikonfigurasi');
    if (!session_id) throw new Error('Sesi tidak ditemukan, silakan masuk kembali.');

    const endpoint = `${url}/web/action/load`;
    
    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: { action_id: actionId },
      id: Math.floor(Math.random() * 1000000000),
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: "include",
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          
          
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) if (response.status === 502) throw new Error('Koneksi ke server Odoo gagal (502 Bad Gateway). Server Odoo Anda sedang offline atau tidak dapat diakses.');
        throw new Error(`HTTP Error: ${response.status}`);

      const responseText = await response.text();
      if (responseText.trim().toLowerCase().startsWith('<!doctype') || responseText.trim().toLowerCase().startsWith('<html')) {
        throw new Error('Sesi autentikasi tidak valid atau telah berakhir.');
      }
      const data = JSON.parse(responseText);
      
      if (data.error) throw new Error(data.error.data?.message || data.error.message || 'Gagal memuat aksi');
      
      return data.result;
    } catch (err: any) {
      throw err;
    }
  }

  async updateUserGroups(xmlIds: string[]) {
    const { uid } = this.config;
    if (!uid) throw new Error('Sesi telah berakhir. Silakan masuk kembali.');

    const modelData = await this.executeKw('ir.model.data', 'search_read', [[['model', '=', 'res.groups']]], {
      fields: ['module', 'name', 'res_id']
    });

    const targetGroupIds = modelData
      .filter((d: any) => xmlIds.includes(`${d.module}.${d.name}`))
      .map((d: any) => d.res_id);

    if (targetGroupIds.length === 0 && xmlIds.length > 0) {
      throw new Error("Tidak dapat menemukan ID modul yang diminta di database.");
    }

    const baseUser = modelData.find((d: any) => d.module === 'base' && d.name === 'group_user');
    if (baseUser && !targetGroupIds.includes(baseUser.res_id)) {
      targetGroupIds.push(baseUser.res_id);
    }

    return this.executeKw('res.users', 'write', [[uid], { groups_id: [[6, 0, targetGroupIds]] }]);
  }

  // Dynamic CRUD Helpers
  async fieldsGet(model: string, attributes?: string[]) {
    return this.executeKw(model, 'fields_get', [], { attributes: attributes || ['string', 'type', 'required', 'readonly', 'selection', 'relation'] });
  }

  async searchRead(model: string, domain: any[] = [], fields: string[] = ['id', 'display_name', 'create_date', 'write_date'], limit: number = 40) {
    return this.executeKw(model, 'search_read', [domain], { fields, limit });
  }

  async create(model: string, values: any) {
    return this.executeKw(model, 'create', [values]);
  }

  async write(model: string, id: number, values: any) {
    return this.executeKw(model, 'write', [[id], values]);
  }

  async unlink(model: string, id: number) {
    return this.executeKw(model, 'unlink', [[id]]);
  }
}

export const odooClient = new OdooClient();
