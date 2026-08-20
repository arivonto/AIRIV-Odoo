import { useState, useEffect } from 'react';
import { odooClient } from '../services/odoo';
import { ProductTemplate } from '../types';
import { formatIDR } from '../lib/utils';
import { Package, Search, Filter, AlertTriangle } from 'lucide-react';

export function Inventory() {
  const [products, setProducts] = useState<ProductTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await odooClient.getProducts();
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (product.default_code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStock = showLowStock ? product.qty_available < 5 : true;
    return matchesSearch && matchesStock;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-48 flex flex-col justify-between">
            <div>
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="flex justify-between items-end">
              <div className="h-6 bg-slate-200 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 rounded-full w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-xl flex flex-col items-center justify-center text-center">
        <h3 className="text-lg font-medium text-rose-800 mb-2">Error Loading Inventory</h3>
        <p className="text-rose-600 mb-4">{error}</p>
        <button onClick={fetchProducts} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
            placeholder="Search SKU or Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowLowStock(!showLowStock)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              showLowStock 
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Low Stock
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-500">
          <div className="flex flex-col items-center justify-center">
            <Package className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-lg font-medium text-slate-900">No products found</p>
            <p className="text-sm">We couldn't find any products matching your current filters.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map(product => {
            const isLowStock = product.qty_available < 5;
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-200 transition-colors group flex flex-col">
                <div className="p-3 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {product.default_code || 'NO-SKU'}
                    </span>
                    {isLowStock && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                        <AlertTriangle className="w-3 h-3" />
                        LOW
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 line-clamp-2" title={product.name}>
                    {product.name}
                  </h3>
                </div>
                
                <div className="p-3 pt-0 border-t border-slate-100 mt-auto pt-3 bg-slate-50/50">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Sales Price</p>
                      <p className="font-bold text-xs text-indigo-600">{formatIDR(product.list_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">On Hand</p>
                      <p className={`font-bold text-sm ${isLowStock ? 'text-amber-500' : 'text-slate-700'}`}>
                        {product.qty_available}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
