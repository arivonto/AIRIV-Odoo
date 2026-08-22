const BASE_URL = '/api/odoo';

let currentSession: any = null;

if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('odoo_session');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.uid && parsed.apiKey) {
        currentSession = parsed;
      } else {
        localStorage.removeItem('odoo_session');
      }
    } catch (e) {
      console.error("Failed to parse odoo session");
    }
  }
}

export const odooService = {
  async fetchOdoo(endpoint: string, params: any) {
    const payload = {
      jsonrpc: "2.0",
      method: "call",
      params: params,
      id: Math.floor(Math.random() * 1000000000)
    };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
         throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.error) {
         throw new Error(data.error.data?.message || data.error.message || 'Unknown Odoo Error');
      }
      return data.result;
    } catch (error: any) {
      const errMsg = error.message || '';
      if (!errMsg.includes("doesn't exist") && !errMsg.includes("not allowed") && !errMsg.includes("Access Denied")) {
        console.error('API Call Failed:', `${BASE_URL}${endpoint}`, error.message);
      }
      throw error;
    }
  },

  async authenticate(db: string, login: string, password?: string) {
    const apiKey = password || '';
    const uid = await this.fetchOdoo('/jsonrpc', {
      service: 'common',
      method: 'authenticate',
      args: [db, login, apiKey, {}]
    });

    if (uid) {
      currentSession = { db, uid, apiKey, username: login, name: login };
      try {
        const users = await this.executeKw('res.users', 'search_read', [[['id', '=', uid]]], { fields: ['company_id'], limit: 1 });
        if (users && users.length > 0) {
          currentSession.company_id = users[0].company_id;
        }
      } catch (e) {
        console.error("Failed to fetch user company", e);
      }
      // App.tsx handles saving it to localStorage, but we can save it here too for safety
      if (typeof window !== 'undefined') {
        localStorage.setItem('odoo_session', JSON.stringify(currentSession));
      }
      return currentSession;
    }
    throw new Error('Authentication failed - invalid credentials');
  },

  async executeKw(model: string, method: string, args: any[], kwargs: any = {}) {
    // If not in current session but in localStorage (e.g. page refresh)
    if (!currentSession && typeof window !== 'undefined') {
       const stored = localStorage.getItem('odoo_session');
       if (stored) {
         const parsed = JSON.parse(stored);
         if (parsed && parsed.uid && parsed.apiKey) {
           currentSession = parsed;
         }
       }
    }

    if (!currentSession || !currentSession.uid) {
      throw new Error('Session expired');
    }

    return this.fetchOdoo('/jsonrpc', {
      service: 'object',
      method: 'execute_kw',
      args: [
        currentSession.db, 
        currentSession.uid, 
        currentSession.apiKey, 
        model, 
        method, 
        args, 
        kwargs
      ]
    });
  },

  async searchRead(model: string, domain: any[], fields: string[], limit: number = 50) {
    return this.executeKw(model, 'search_read', [domain], { fields, limit });
  },

  async createRecord(model: string, values: any) {
    return this.executeKw(model, 'create', [values]);
  },

  async writeRecord(model: string, id: number, values: any) {
    return this.executeKw(model, 'write', [[id], values]);
  },

  async deleteRecord(model: string, id: number) {
    return this.executeKw(model, 'unlink', [[id]]);
  },
  async unlinkRecord(model: string, id: number) {
    return this.executeKw(model, 'unlink', [[id]]);
  },

  async logout() {
    currentSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odoo_session');
    }
    return true;
  }
};
