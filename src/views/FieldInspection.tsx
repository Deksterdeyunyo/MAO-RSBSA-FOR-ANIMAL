import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface Inspection {
  id: string;
  date: string;
  farmer_name: string;
  location: string;
  inspector: string;
  purpose: string;
  findings: string;
  recommendations: string;
  farm_condition_rating: number;
  next_inspection_date: string;
  weather_condition: string;
  farm_area_sqm: number;
  water_source: string;
  biosecurity_level: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed' | 'Follow-up Required';
}

export default function FieldInspection({ userRole }: { userRole?: string }) {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<Inspection | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], farmerName: '', location: '', inspector: '', 
    purpose: '', findings: '', recommendations: '', farmConditionRating: 3, nextInspectionDate: '', 
    weatherCondition: 'Sunny', farmAreaSqm: 0, waterSource: '', biosecurityLevel: 'Medium',
    status: 'Pending' 
  });

  const isEncoder = userRole === 'Encoder';

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    const { data, error } = await supabase.from('field_inspections').select('*').order('created_at', { ascending: false });
    if (data) setInspections(data);
    if (error) console.error('Error fetching inspections:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      date: formData.date,
      farmer_name: formData.farmerName,
      location: formData.location,
      inspector: formData.inspector,
      purpose: formData.purpose,
      findings: formData.findings,
      recommendations: formData.recommendations,
      farm_condition_rating: formData.farmConditionRating,
      next_inspection_date: formData.nextInspectionDate || null,
      weather_condition: formData.weatherCondition,
      farm_area_sqm: formData.farmAreaSqm,
      water_source: formData.waterSource,
      biosecurity_level: formData.biosecurityLevel,
      status: formData.status
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('field_inspections').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('field_inspections').insert([payload]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchInspections();
    } else {
      console.error('Error saving inspection:', error);
      alert('Failed to save inspection. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (inspection: Inspection) => {
    setFormData({
      date: inspection.date || new Date().toISOString().split('T')[0],
      farmerName: inspection.farmer_name || '',
      location: inspection.location || '',
      inspector: inspection.inspector || '',
      purpose: inspection.purpose || '',
      findings: inspection.findings || '',
      recommendations: inspection.recommendations || '',
      farmConditionRating: inspection.farm_condition_rating || 3,
      nextInspectionDate: inspection.next_inspection_date || '',
      weatherCondition: inspection.weather_condition || 'Sunny',
      farmAreaSqm: inspection.farm_area_sqm || 0,
      waterSource: inspection.water_source || '',
      biosecurityLevel: inspection.biosecurity_level || 'Medium',
      status: inspection.status || 'Pending'
    });
    setEditingId(inspection.id);
    setIsModalOpen(true);
  };

  const handleDelete = (inspection: Inspection) => {
    setInspectionToDelete(inspection);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;
    
    const { error } = await supabase.from('field_inspections').delete().eq('id', inspectionToDelete.id);
    if (!error) {
      setIsDeleteModalOpen(false);
      setInspectionToDelete(null);
      fetchInspections();
    } else {
      console.error('Error deleting inspection:', error);
      alert('Failed to delete record: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected inspection records?`)) {
      const { error } = await supabase.from('field_inspections').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchInspections();
      } else {
        console.error('Error in bulk delete:', error);
        alert('Failed to delete some records.');
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (window.confirm(`Update status to ${status} for ${selectedIds.length} selected inspection records?`)) {
      const { error } = await supabase.from('field_inspections').update({ status }).in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchInspections();
      } else {
        console.error('Error in bulk status update:', error);
        alert('Failed to update status.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInspections.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInspections.map(i => i.id));
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
      date: new Date().toISOString().split('T')[0], farmerName: '', location: '', inspector: '', 
      purpose: '', findings: '', recommendations: '', farmConditionRating: 3, nextInspectionDate: '', 
      weatherCondition: 'Sunny', farmAreaSqm: 0, waterSource: '', biosecurityLevel: 'Medium',
      status: 'Pending' 
    });
  };

  const filteredInspections = inspections.filter(i => {
    const matchesSearch = i.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          i.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Follow-up Required': return 'bg-red-100 text-red-800';
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
              placeholder="Search by Farmer or Location..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isEncoder && selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-[#00965e]/10 px-3 py-1.5 rounded-lg border border-[#00965e]/20 animate-in fade-in slide-in-from-left-2">
              <span className="text-sm font-bold text-[#00965e]">{selectedIds.length} selected</span>
              <div className="h-4 w-px bg-gray-300 mx-1" />
              <select 
                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                className="text-xs bg-white border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#00965e]"
                value=""
              >
                <option value="" disabled>Update Status</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Follow-up Required">Follow-up Required</option>
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
            <option value="Pending">Pending</option>
            <option value="Follow-up Required">Follow-up Required</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>Log Inspection</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                {!isEncoder && (
                  <th className="px-6 py-4 font-medium w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                      checked={selectedIds.length === filteredInspections.length && filteredInspections.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 font-medium">Date & Inspector</th>
                <th className="px-6 py-4 font-medium">Farmer & Location</th>
                <th className="px-6 py-4 font-medium">Purpose & Findings</th>
                <th className="px-6 py-4 font-medium text-center">Rating</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(inspection.id) ? 'bg-green-50/50' : ''}`}>
                  {!isEncoder && (
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                        checked={selectedIds.includes(inspection.id)}
                        onChange={() => toggleSelect(inspection.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{new Date(inspection.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500 mt-1">{inspection.inspector}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{inspection.farmer_name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3" /> {inspection.location}
                    </div>
                    <div className="text-[10px] text-blue-600 mt-1">Weather: {inspection.weather_condition} • Area: {inspection.farm_area_sqm}sqm</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-medium">{inspection.purpose}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs mt-1">{inspection.findings}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-800 font-bold">
                      {inspection.farm_condition_rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(inspection)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isEncoder && (
                        <button onClick={() => handleDelete(inspection)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInspections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No field inspections found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Field Inspection" : "Log Field Inspection"} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name</label>
              <input required type="text" value={formData.inspector} onChange={e => setFormData({...formData, inspector: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Name</label>
              <input required type="text" value={formData.farmerName} onChange={e => setFormData({...formData, farmerName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location/Address</label>
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Inspection</label>
            <input required type="text" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea required rows={2} value={formData.findings} onChange={e => setFormData({...formData, findings: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
            <textarea rows={2} value={formData.recommendations} onChange={e => setFormData({...formData, recommendations: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"></textarea>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition Rating (1-5)</label>
              <input required type="number" min="1" max="5" value={formData.farmConditionRating} onChange={e => setFormData({...formData, farmConditionRating: parseInt(e.target.value) || 3})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Inspection</label>
              <input type="date" value={formData.nextInspectionDate} onChange={e => setFormData({...formData, nextInspectionDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Follow-up Required">Follow-up Required</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weather Condition</label>
              <input type="text" value={formData.weatherCondition} onChange={e => setFormData({...formData, weatherCondition: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Area (sqm)</label>
              <input type="number" value={formData.farmAreaSqm} onChange={e => setFormData({...formData, farmAreaSqm: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Water Source</label>
              <input type="text" value={formData.waterSource} onChange={e => setFormData({...formData, waterSource: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biosecurity Level</label>
              <select value={formData.biosecurityLevel} onChange={e => setFormData({...formData, biosecurityLevel: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Inspection" : "Save Inspection"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Inspection Record</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Are you sure you want to delete the inspection record for <span className="font-bold text-gray-900 uppercase">{inspectionToDelete?.farmer_name}</span>? This action cannot be undone and will permanently remove this record from the system.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setInspectionToDelete(null);
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
