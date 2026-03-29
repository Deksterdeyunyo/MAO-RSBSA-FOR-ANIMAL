import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Box, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  expiration_date: string | null;
  supplier: string;
  batch_number: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Medicine', 'Feed', 'Equipment', 'Vaccine']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [customFilterCategory, setCustomFilterCategory] = useState('');
  const [isCustomFilter, setIsCustomFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [formData, setFormData] = useState({ 
    itemName: '', category: '', quantity: 0, unit: 'kg', 
    reorderLevel: 10, expirationDate: '', supplier: '', batchNumber: '' 
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) {
      setItems(data);
      const fetchedCategories = Array.from(new Set(data.map(item => item.category))).filter(Boolean);
      const mergedCategories = Array.from(new Set(['Medicine', 'Feed', 'Equipment', 'Vaccine', ...fetchedCategories]));
      setCategories(mergedCategories);
    }
    if (error) console.error('Error fetching inventory:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalCategory = isCustomCategory ? customCategory.trim() : formData.category;
    
    if (!finalCategory) {
      alert("Please select or enter a category.");
      return;
    }

    const { error } = await supabase.from('inventory').insert([{
      item_name: formData.itemName,
      category: finalCategory,
      quantity: formData.quantity,
      unit: formData.unit,
      reorder_level: formData.reorderLevel,
      expiration_date: formData.expirationDate || null,
      supplier: formData.supplier,
      batch_number: formData.batchNumber
    }]);
    
    if (!error) {
      setIsModalOpen(false);
      setFormData({ itemName: '', category: '', quantity: 0, unit: 'kg', reorderLevel: 10, expirationDate: '', supplier: '', batchNumber: '' });
      setIsCustomCategory(false);
      setCustomCategory('');
      fetchInventory();
    } else {
      console.error('Error adding inventory item:', error);
      alert('Failed to add item. Please ensure Supabase is configured.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await supabase.from('inventory').delete().eq('id', id);
      fetchInventory();
    }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.batch_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const activeFilterCategory = isCustomFilter ? customFilterCategory : filterCategory;
    const matchesCategory = activeFilterCategory === 'All' || activeFilterCategory === '' || i.category === activeFilterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Medicine': return 'bg-red-100 text-red-800';
      case 'Vaccine': return 'bg-blue-100 text-blue-800';
      case 'Feed': return 'bg-yellow-100 text-yellow-800';
      case 'Equipment': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by Item Name or Batch..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex items-center gap-2">
            <select 
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e]"
              value={filterCategory}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Custom') {
                  setIsCustomFilter(true);
                  setFilterCategory('Custom');
                } else {
                  setIsCustomFilter(false);
                  setFilterCategory(val);
                  setCustomFilterCategory('');
                }
              }}
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="Custom">Custom Category...</option>
            </select>
            {!isCustomFilter && <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />}
            
            {isCustomFilter && (
              <input
                type="text"
                placeholder="Enter category..."
                value={customFilterCategory}
                onChange={(e) => setCustomFilterCategory(e.target.value)}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e]"
              />
            )}
          </div>
        </div>
        <button 
          onClick={() => {
            setIsModalOpen(true);
            setFormData({ itemName: '', category: '', quantity: 0, unit: 'kg', reorderLevel: 10, expirationDate: '', supplier: '', batchNumber: '' });
            setIsCustomCategory(false);
            setCustomCategory('');
          }}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Item Name & Batch</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Stock Level</th>
                <th className="px-6 py-4 font-medium">Supplier & Expiry</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const isLowStock = item.quantity <= item.reorder_level;
                const isExpired = item.expiration_date && new Date(item.expiration_date) < new Date();
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {item.item_name}
                        {isLowStock && <AlertTriangle className="w-4 h-4 text-orange-500" title="Low Stock" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Batch: {item.batch_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-gray-900'}`}>
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Reorder at: {item.reorder_level} {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{item.supplier || 'N/A'}</div>
                      <div className={`text-xs mt-1 ${isExpired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                        Exp: {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : 'N/A'}
                        {isExpired && ' (EXPIRED)'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <label className="block text-sm font-bold text-gray-900 mb-2">Category (Required First) *</label>
            <div className="flex flex-col gap-2">
              <select 
                required={!isCustomCategory} 
                value={formData.category} 
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Custom') {
                    setIsCustomCategory(true);
                    setFormData({...formData, category: 'Custom'});
                  } else {
                    setIsCustomCategory(false);
                    setFormData({...formData, category: val});
                    setCustomCategory('');
                  }
                }} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e] bg-white"
              >
                <option value="" disabled>Select a category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Custom" className="font-bold text-[#00965e]">+ Add Custom Category...</option>
              </select>
              {isCustomCategory && (
                <div className="flex gap-2 mt-2">
                  <input
                    required
                    type="text"
                    placeholder="Enter custom category name..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCustomCategory('');
                      setFormData({...formData, category: ''});
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input 
                required 
                type="text" 
                value={formData.itemName} 
                onChange={e => setFormData({...formData, itemName: e.target.value})} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e] disabled:bg-gray-100 disabled:cursor-not-allowed" 
                disabled={!formData.category && !isCustomCategory}
                placeholder={(!formData.category && !isCustomCategory) ? "Please select a category first" : "Enter item name"}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input required type="number" min="0" step="0.01" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input required type="text" placeholder="e.g. kg, vials, pcs" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
              <input required type="number" min="0" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input type="text" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">Save Item</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
