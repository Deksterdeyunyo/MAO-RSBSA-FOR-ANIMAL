import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface Distribution {
  id: string;
  program_name: string;
  funding_source: string;
  item_type: string;
  quantity: number;
  unit: string;
  date: string;
  location: string;
  distributor_name: string;
  beneficiaries_count: number;
  batch_number: string;
  distribution_point: string;
  received_by_proxy: boolean;
  proxy_name: string;
  status: 'Completed' | 'Ongoing' | 'Planned';
}

export default function ProgramDistribution() {
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    programName: '', fundingSource: 'LGU', itemType: 'Feeds', quantity: 0, unit: 'Sacks', 
    date: new Date().toISOString().split('T')[0], location: '', distributorName: '', beneficiariesCount: 0, 
    batchNumber: '', distributionPoint: '', receivedByProxy: false, proxyName: '',
    status: 'Planned' 
  });

  useEffect(() => {
    fetchDistributions();
  }, []);

  const fetchDistributions = async () => {
    const { data, error } = await supabase.from('distributions').select('*').order('created_at', { ascending: false });
    if (data) setDistributions(data);
    if (error) console.error('Error fetching distributions:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      program_name: formData.programName,
      funding_source: formData.fundingSource,
      item_type: formData.itemType,
      quantity: formData.quantity,
      unit: formData.unit,
      date: formData.date,
      location: formData.location,
      distributor_name: formData.distributorName,
      beneficiaries_count: formData.beneficiariesCount,
      batch_number: formData.batchNumber,
      distribution_point: formData.distributionPoint,
      received_by_proxy: formData.receivedByProxy,
      proxy_name: formData.proxyName,
      status: formData.status
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('distributions').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('distributions').insert([payload]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchDistributions();
    } else {
      console.error('Error saving distribution:', error);
      alert('Failed to save program. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (dist: Distribution) => {
    setFormData({
      programName: dist.program_name || '',
      fundingSource: dist.funding_source || 'LGU',
      itemType: dist.item_type || 'Feeds',
      quantity: dist.quantity || 0,
      unit: dist.unit || 'Sacks',
      date: dist.date || new Date().toISOString().split('T')[0],
      location: dist.location || '',
      distributorName: dist.distributor_name || '',
      beneficiariesCount: dist.beneficiaries_count || 0,
      batchNumber: dist.batch_number || '',
      distributionPoint: dist.distribution_point || '',
      receivedByProxy: !!dist.received_by_proxy,
      proxyName: dist.proxy_name || '',
      status: dist.status || 'Planned'
    });
    setEditingId(dist.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      await supabase.from('distributions').delete().eq('id', id);
      fetchDistributions();
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected programs?`)) {
      const { error } = await supabase.from('distributions').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchDistributions();
      } else {
        console.error('Error in bulk delete:', error);
        alert('Failed to delete some records.');
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (window.confirm(`Update status to ${status} for ${selectedIds.length} selected programs?`)) {
      const { error } = await supabase.from('distributions').update({ status }).in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchDistributions();
      } else {
        console.error('Error in bulk status update:', error);
        alert('Failed to update status.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDistributions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDistributions.map(d => d.id));
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
      programName: '', fundingSource: 'LGU', itemType: 'Feeds', quantity: 0, unit: 'Sacks', 
      date: new Date().toISOString().split('T')[0], location: '', distributorName: '', beneficiariesCount: 0, 
      batchNumber: '', distributionPoint: '', receivedByProxy: false, proxyName: '',
      status: 'Planned' 
    });
  };

  const filteredDistributions = distributions.filter(d => {
    const matchesSearch = d.program_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Planned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
              placeholder="Search programs..." 
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
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
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
        <div className="relative">
          <select 
            className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Planned">Planned</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>New Program</span>
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
                    checked={selectedIds.length === filteredDistributions.length && filteredDistributions.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-medium">Program Name</th>
                <th className="px-6 py-4 font-medium">Items & Quantity</th>
                <th className="px-6 py-4 font-medium">Logistics</th>
                <th className="px-6 py-4 font-medium text-center">Beneficiaries</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDistributions.map((dist) => (
                <tr key={dist.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(dist.id) ? 'bg-green-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                      checked={selectedIds.includes(dist.id)}
                      onChange={() => toggleSelect(dist.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{dist.program_name}</div>
                    <div className="text-xs text-gray-500 mt-1">Funding: {dist.funding_source}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>{dist.item_type}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{dist.quantity} {dist.unit}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{new Date(dist.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500 mt-1">{dist.location} • {dist.distributor_name}</div>
                    {dist.batch_number && <div className="text-[10px] text-blue-600 font-bold mt-0.5">BATCH: {dist.batch_number}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dist.beneficiaries_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(dist.status)}`}>
                      {dist.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(dist)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(dist.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDistributions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No distribution programs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Distribution Program" : "New Distribution Program"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
              <input required type="text" value={formData.programName} onChange={e => setFormData({...formData, programName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding Source</label>
              <select required value={formData.fundingSource} onChange={e => setFormData({...formData, fundingSource: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="LGU">LGU</option>
                <option value="DA National">DA National</option>
                <option value="NGO">NGO</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
              <select required value={formData.itemType} onChange={e => setFormData({...formData, itemType: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Feeds">Feeds</option>
                <option value="Vitamins">Vitamins</option>
                <option value="Equipment">Equipment</option>
                <option value="Livestock">Livestock</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input required type="text" placeholder="e.g. Sacks, Vials" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distributor Name</label>
              <input required type="text" value={formData.distributorName} onChange={e => setFormData({...formData, distributorName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiaries Count</label>
              <input required type="number" min="0" value={formData.beneficiariesCount} onChange={e => setFormData({...formData, beneficiariesCount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Planned">Planned</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input type="text" value={formData.batchNumber} onChange={e => setFormData({...formData, batchNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Point</label>
              <input type="text" value={formData.distributionPoint} onChange={e => setFormData({...formData, distributionPoint: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-center py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.receivedByProxy} onChange={e => setFormData({...formData, receivedByProxy: e.target.checked})} className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Received by Proxy?</span>
            </label>
            {formData.receivedByProxy && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proxy Name</label>
                <input type="text" value={formData.proxyName} onChange={e => setFormData({...formData, proxyName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Program" : "Save Program"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
