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
  status: string;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Medicine', 'Feed', 'Equipment', 'Vaccine']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [customFilterCategory, setCustomFilterCategory] = useState('');
  const [isCustomFilter, setIsCustomFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [formData, setFormData] = useState({ 
    itemName: '', category: '', quantity: 0, unit: 'kg', 
    reorderLevel: 10, expirationDate: '', supplier: '', batchNumber: '',
    status: 'In Stock'
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

    const payload = {
      item_name: formData.itemName,
      category: finalCategory,
      quantity: formData.quantity,
      unit: formData.unit,
      reorder_level: formData.reorderLevel,
      expiration_date: formData.expirationDate || null,
      supplier: formData.supplier,
      batch_number: formData.batchNumber,
      status: formData.status
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('inventory').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('inventory').insert([payload]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchInventory();
    } else {
      console.error('Error saving inventory item:', error);
      alert('Failed to save item. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      itemName: item.item_name || '',
      category: item.category || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'kg',
      reorderLevel: item.reorder_level || 10,
      expirationDate: item.expiration_date || '',
      supplier: item.supplier || '',
      batchNumber: item.batch_number || '',
      status: item.status || 'In Stock'
    });
    
    // Check if category is custom
    if (item.category && !categories.includes(item.category)) {
      setIsCustomCategory(true);
      setCustomCategory(item.category);
      setFormData(prev => ({ ...prev, category: 'Custom' }));
    } else {
      setIsCustomCategory(false);
      setCustomCategory('');
    }

    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    const { error } = await supabase.from('inventory').delete().eq('id', itemToDelete.id);
    if (!error) {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchInventory();
    } else {
      console.error('Error deleting inventory item:', error);
      alert('Failed to delete item: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) {
      const { error } = await supabase.from('inventory').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchInventory();
      } else {
        console.error('Error in bulk delete:', error);
        alert('Failed to delete some records.');
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (window.confirm(`Update status to ${status} for ${selectedIds.length} selected items?`)) {
      const { error } = await supabase.from('inventory').update({ status }).in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchInventory();
      } else {
        console.error('Error in bulk status update:', error);
        alert('Failed to update status.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ 
      itemName: '', category: '', quantity: 0, unit: 'kg', 
      reorderLevel: 10, expirationDate: '', supplier: '', batchNumber: '',
      status: 'In Stock'
    });
    setIsCustomCategory(false);
    setCustomCategory('');
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

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'in stock': return 'bg-green-100 text-green-800';
      case 'low stock': return 'bg-yellow-100 text-yellow-800';
      case 'out of stock': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by Item Name or Batch..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-[#00965e]/10 px-3 py-1.5 rounded-lg border border-[#00965e]/20 animate-in fade-in slide-in-from-left-2">
              <span className="text-sm font-bold text-[#00965e]">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <select 
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#00965e]"
                value=""
              >
                <option value="" disabled>Update Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Expired">Expired</option>
                <option value="Archived">Archived</option>
              </select>
              <button 
                onClick={handleBulkDelete}
                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                title="Bulk Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
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
                <th className="px-6 py-4 font-medium w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-medium">Item Name & Batch</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
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
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-green-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status || 'In Stock'}
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
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Inventory Item" : "Add Inventory Item"}>
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
              <input required type="text" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Expired">Expired</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
              <input type="date" value={formData.expirationDate} onChange={e => setFormData({...formData, expirationDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Item" : "Save Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Inventory Item</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Are you sure you want to delete the item <span className="font-bold text-gray-900 uppercase">{itemToDelete?.item_name}</span>? This action cannot be undone and will permanently remove this record from the system.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all active:scale-95 shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
