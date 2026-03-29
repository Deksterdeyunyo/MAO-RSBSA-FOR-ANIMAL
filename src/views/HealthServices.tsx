import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface HealthRecord {
  id: string;
  date: string;
  farmer_name: string;
  livestock_tag: string;
  species: string;
  type: 'Vaccination' | 'Treatment' | 'Deworming' | 'Checkup';
  description: string;
  dosage: string;
  diagnosis: string;
  treatment_given: string;
  medicine_used: string;
  follow_up_date: string;
  next_schedule: string;
  remarks: string;
  cost: number;
  technician: string;
  status: 'Completed' | 'Pending' | 'Cancelled';
}

export default function HealthServices({ userRole }: { userRole?: string }) {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<HealthRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    farmerName: '', livestockTag: '', species: 'Cattle', 
    type: 'Vaccination', description: '', dosage: '', 
    diagnosis: '', treatmentGiven: '', medicineUsed: '', followUpDate: '',
    nextSchedule: '', remarks: '', cost: 0, technician: '',
    status: 'Completed'
  });

  const isEncoder = userRole === 'Encoder';

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const { data, error } = await supabase.from('health_records').select('*').order('created_at', { ascending: false });
    if (data) setRecords(data);
    if (error) console.error('Error fetching health records:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      date: formData.date,
      farmer_name: formData.farmerName,
      livestock_tag: formData.livestockTag,
      species: formData.species,
      type: formData.type,
      description: formData.description,
      dosage: formData.dosage,
      diagnosis: formData.diagnosis,
      treatment_given: formData.treatmentGiven,
      medicine_used: formData.medicineUsed,
      follow_up_date: formData.followUpDate || null,
      next_schedule: formData.nextSchedule || null,
      remarks: formData.remarks,
      cost: formData.cost,
      technician: formData.technician,
      status: formData.status
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('health_records').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('health_records').insert([payload]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchRecords();
    } else {
      console.error('Error saving health record:', error);
      alert('Failed to save health record. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (record: HealthRecord) => {
    setFormData({
      date: record.date || new Date().toISOString().split('T')[0],
      farmerName: record.farmer_name || '',
      livestockTag: record.livestock_tag || '',
      species: record.species || 'Cattle',
      type: record.type || 'Vaccination',
      description: record.description || '',
      dosage: record.dosage || '',
      diagnosis: record.diagnosis || '',
      treatmentGiven: record.treatment_given || '',
      medicineUsed: record.medicine_used || '',
      followUpDate: record.follow_up_date || '',
      nextSchedule: record.next_schedule || '',
      remarks: record.remarks || '',
      cost: record.cost || 0,
      technician: record.technician || '',
      status: record.status || 'Completed'
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleDelete = (record: HealthRecord) => {
    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    
    const { error } = await supabase.from('health_records').delete().eq('id', recordToDelete.id);
    if (!error) {
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
      fetchRecords();
    } else {
      console.error('Error deleting health record:', error);
      alert('Failed to delete record: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected records?`)) {
      const { error } = await supabase.from('health_records').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchRecords();
      } else {
        console.error('Error in bulk delete:', error);
        alert('Failed to delete some records.');
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (window.confirm(`Update status to ${status} for ${selectedIds.length} selected records?`)) {
      const { error } = await supabase.from('health_records').update({ status }).in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchRecords();
      } else {
        console.error('Error in bulk status update:', error);
        alert('Failed to update status.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRecords.map(r => r.id));
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
      date: new Date().toISOString().split('T')[0], 
      farmerName: '', livestockTag: '', species: 'Cattle', 
      type: 'Vaccination', description: '', dosage: '', 
      diagnosis: '', treatmentGiven: '', medicineUsed: '', followUpDate: '',
      nextSchedule: '', remarks: '', cost: 0, technician: '',
      status: 'Completed'
    });
  };

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.livestock_tag?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || r.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Vaccination': return 'bg-blue-100 text-blue-800';
      case 'Treatment': return 'bg-red-100 text-red-800';
      case 'Deworming': return 'bg-purple-100 text-purple-800';
      case 'Checkup': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
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
              placeholder="Search by Farmer or Tag ID..." 
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
                <option value="Cancelled">Cancelled</option>
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Treatment">Treatment</option>
            <option value="Deworming">Deworming</option>
            <option value="Checkup">Checkup</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>Record Service</span>
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
                      checked={selectedIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Farmer & Livestock</th>
                <th className="px-6 py-4 font-medium">Service Type</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Details & Cost</th>
                <th className="px-6 py-4 font-medium">Technician</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(record.id) ? 'bg-green-50/50' : ''}`}>
                  {!isEncoder && (
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{record.farmer_name}</div>
                    <div className="text-xs text-gray-500">Tag: {record.livestock_tag} ({record.species})</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(record.type)}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status || 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="truncate max-w-xs font-medium">{record.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {record.diagnosis && <span className="text-red-500 font-bold">Dx: {record.diagnosis} • </span>}
                      Dosage: {record.dosage || 'N/A'} • Cost: ₱{record.cost}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{record.technician}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(record)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isEncoder && (
                        <button onClick={() => handleDelete(record)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No health records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Health Service" : "Record Health Service"} size="2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Vaccination">Vaccination</option>
                <option value="Treatment">Treatment</option>
                <option value="Deworming">Deworming</option>
                <option value="Checkup">Checkup</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Name</label>
              <input required type="text" value={formData.farmerName} onChange={e => setFormData({...formData, farmerName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livestock Tag ID</label>
              <input required type="text" value={formData.livestockTag} onChange={e => setFormData({...formData, livestockTag: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
              <select required value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Cattle">Cattle</option>
                <option value="Swine">Swine</option>
                <option value="Poultry">Poultry</option>
                <option value="Goat">Goat</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage/Medicine</label>
              <input type="text" value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description/Diagnosis</label>
            <textarea required rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <input type="text" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Used</label>
              <input type="text" value={formData.medicineUsed} onChange={e => setFormData({...formData, medicineUsed: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Given</label>
            <textarea rows={2} value={formData.treatmentGiven} onChange={e => setFormData({...formData, treatmentGiven: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"></textarea>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input type="date" value={formData.followUpDate} onChange={e => setFormData({...formData, followUpDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Schedule</label>
              <input type="date" value={formData.nextSchedule} onChange={e => setFormData({...formData, nextSchedule: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₱)</label>
              <input required type="number" min="0" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician Name</label>
              <input required type="text" value={formData.technician} onChange={e => setFormData({...formData, technician: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Record" : "Save Record"}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Health Record</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Are you sure you want to delete the health record for <span className="font-bold text-gray-900 uppercase">{recordToDelete?.farmer_name}</span>? This action cannot be undone and will permanently remove this record from the system.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRecordToDelete(null);
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
