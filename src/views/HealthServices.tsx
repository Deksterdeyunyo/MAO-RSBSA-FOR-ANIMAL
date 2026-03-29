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
  next_schedule: string;
  remarks: string;
  cost: number;
  technician: string;
}

export default function HealthServices() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    farmerName: '', livestockTag: '', species: 'Cattle', 
    type: 'Vaccination', description: '', dosage: '', nextSchedule: '', remarks: '', cost: 0, technician: '' 
  });

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
    const { error } = await supabase.from('health_records').insert([{
      date: formData.date,
      farmer_name: formData.farmerName,
      livestock_tag: formData.livestockTag,
      species: formData.species,
      type: formData.type,
      description: formData.description,
      dosage: formData.dosage,
      next_schedule: formData.nextSchedule || null,
      remarks: formData.remarks,
      cost: formData.cost,
      technician: formData.technician
    }]);
    
    if (!error) {
      setIsModalOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], farmerName: '', livestockTag: '', species: 'Cattle', type: 'Vaccination', description: '', dosage: '', nextSchedule: '', remarks: '', cost: 0, technician: '' });
      fetchRecords();
    } else {
      console.error('Error adding health record:', error);
      alert('Failed to add health record. Please ensure Supabase is configured.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      await supabase.from('health_records').delete().eq('id', id);
      fetchRecords();
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by Farmer or Tag ID..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Farmer & Livestock</th>
                <th className="px-6 py-4 font-medium">Service Type</th>
                <th className="px-6 py-4 font-medium">Details & Cost</th>
                <th className="px-6 py-4 font-medium">Technician</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
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
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="truncate max-w-xs">{record.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Dosage: {record.dosage || 'N/A'} • Cost: ₱{record.cost}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{record.technician}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Health Service">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Schedule</label>
              <input type="date" value={formData.nextSchedule} onChange={e => setFormData({...formData, nextSchedule: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₱)</label>
              <input required type="number" min="0" step="0.01" value={formData.cost} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician Name</label>
              <input required type="text" value={formData.technician} onChange={e => setFormData({...formData, technician: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <input type="text" value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">Save Record</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
