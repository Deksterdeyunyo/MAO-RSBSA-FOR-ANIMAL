import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface LivestockData {
  id: string;
  tag_id: string;
  farmer_name: string;
  species: string;
  breed: string;
  color: string;
  weight_kg: number;
  purpose: string;
  age: string;
  sex: 'Male' | 'Female';
  date_acquired: string;
  status: 'Healthy' | 'Sick' | 'Deceased';
  birthdate: string;
  health_status: string;
  vaccination_status: string;
  source_of_animal: string;
  is_insured: boolean;
  insurance_id: string;
  last_vaccination_date: string;
}

export default function Livestock({ userRole }: { userRole?: string }) {
  const [livestock, setLivestock] = useState<LivestockData[]>([]);
  const [farmers, setFarmers] = useState<{id: string, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [livestockToDelete, setLivestockToDelete] = useState<LivestockData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    tagId: '', farmerName: '', species: 'Cattle', breed: '', color: '', 
    weightKg: 0, purpose: 'Meat', age: '', sex: 'Male', dateAcquired: '', status: 'Healthy',
    birthdate: '', healthStatus: 'Good', vaccinationStatus: 'Up to date',
    sourceOfAnimal: 'Local Purchase', isInsured: false, insuranceId: '', lastVaccinationDate: ''
  });

  const isEncoder = userRole === 'Encoder';

  useEffect(() => {
    fetchLivestock();
    fetchFarmers();
  }, []);

  const fetchLivestock = async () => {
    const { data, error } = await supabase.from('livestock').select('*').order('created_at', { ascending: false });
    if (data) setLivestock(data);
    if (error) console.error('Error fetching livestock:', error);
  };

  const fetchFarmers = async () => {
    const { data, error } = await supabase.from('farmers').select('id, name').order('name');
    if (data) setFarmers(data);
    if (error) console.error('Error fetching farmers:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      tag_id: formData.tagId,
      farmer_name: formData.farmerName,
      species: formData.species,
      breed: formData.breed,
      color: formData.color,
      weight_kg: formData.weightKg,
      purpose: formData.purpose,
      age: formData.age,
      sex: formData.sex,
      date_acquired: formData.dateAcquired || null,
      status: formData.status,
      birthdate: formData.birthdate || null,
      health_status: formData.healthStatus,
      vaccination_status: formData.vaccinationStatus,
      source_of_animal: formData.sourceOfAnimal,
      is_insured: formData.isInsured,
      insurance_id: formData.insuranceId,
      last_vaccination_date: formData.lastVaccinationDate || null
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('livestock').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('livestock').insert([payload]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchLivestock();
    } else {
      console.error('Error saving livestock:', error);
      alert('Failed to save livestock. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (item: LivestockData) => {
    setFormData({
      tagId: item.tag_id || '',
      farmerName: item.farmer_name || '',
      species: item.species || 'Cattle',
      breed: item.breed || '',
      color: item.color || '',
      weightKg: item.weight_kg || 0,
      purpose: item.purpose || 'Meat',
      age: item.age || '',
      sex: item.sex || 'Male',
      dateAcquired: item.date_acquired || '',
      status: item.status || 'Healthy',
      birthdate: item.birthdate || '',
      healthStatus: item.health_status || 'Good',
      vaccinationStatus: item.vaccination_status || 'Up to date',
      sourceOfAnimal: item.source_of_animal || 'Local Purchase',
      isInsured: !!item.is_insured,
      insuranceId: item.insurance_id || '',
      lastVaccinationDate: item.last_vaccination_date || ''
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = (item: LivestockData) => {
    setLivestockToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!livestockToDelete) return;
    
    const { error } = await supabase.from('livestock').delete().eq('id', livestockToDelete.id);
    if (!error) {
      setIsDeleteModalOpen(false);
      setLivestockToDelete(null);
      fetchLivestock();
    } else {
      console.error('Error deleting livestock:', error);
      alert('Failed to delete record: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected records?`)) {
      const { error } = await supabase.from('livestock').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchLivestock();
      } else {
        console.error('Error in bulk delete:', error);
        alert('Failed to delete some records.');
      }
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (window.confirm(`Update status to ${status} for ${selectedIds.length} selected records?`)) {
      const { error } = await supabase.from('livestock').update({ status }).in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchLivestock();
      } else {
        console.error('Error in bulk status update:', error);
        alert('Failed to update status.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLivestock.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLivestock.map(l => l.id));
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
      tagId: '', 
      farmerName: '', 
      species: 'Cattle', 
      breed: '', 
      color: '', 
      weightKg: 0, 
      purpose: 'Meat', 
      age: '', 
      sex: 'Male', 
      dateAcquired: '', 
      status: 'Healthy',
      birthdate: '',
      healthStatus: 'Good',
      vaccinationStatus: 'Up to date',
      sourceOfAnimal: 'Local Purchase',
      isInsured: false,
      insuranceId: '',
      lastVaccinationDate: ''
    });
  };

  const filteredLivestock = livestock.filter(l => {
    const matchesSearch = l.tag_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          l.farmer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecies = filterSpecies === 'All' || l.species === filterSpecies;
    return matchesSearch && matchesSpecies;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Healthy': return 'bg-green-100 text-green-800';
      case 'Sick': return 'bg-yellow-100 text-yellow-800';
      case 'Deceased': return 'bg-red-100 text-red-800';
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
              placeholder="Search by Tag ID or Farmer..." 
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
                <option value="Healthy">Healthy</option>
                <option value="Sick">Sick</option>
                <option value="Deceased">Deceased</option>
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
            value={filterSpecies}
            onChange={(e) => setFilterSpecies(e.target.value)}
          >
            <option value="All">All Species</option>
            <option value="Cattle">Cattle</option>
            <option value="Swine">Swine</option>
            <option value="Poultry">Poultry</option>
            <option value="Goat">Goat</option>
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span>Add Livestock</span>
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
                      checked={selectedIds.length === filteredLivestock.length && filteredLivestock.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 font-medium">Tag ID</th>
                <th className="px-6 py-4 font-medium">Farmer</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Metrics</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLivestock.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(item.id) ? 'bg-green-50/50' : ''}`}>
                  {!isEncoder && (
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.tag_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.farmer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{item.species} - {item.breed}</div>
                    <div className="text-xs text-gray-500">{item.color} • {item.purpose}</div>
                    <div className="text-xs text-blue-600 mt-1">Vax: {item.vaccination_status}</div>
                    {item.is_insured && <div className="text-[10px] text-green-600 font-bold mt-0.5">INSURED: {item.insurance_id}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div>{item.age} ({item.sex})</div>
                    <div className="text-xs text-gray-500">{item.weight_kg} kg</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isEncoder && (
                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLivestock.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No livestock found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Livestock" : "Add Livestock"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tag ID</label>
              <input required type="text" value={formData.tagId} onChange={e => setFormData({...formData, tagId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Name</label>
              <select 
                required 
                value={formData.farmerName} 
                onChange={e => setFormData({...formData, farmerName: e.target.value})} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"
              >
                <option value="">Select Farmer</option>
                {farmers.map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
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
                <option value="Carabao">Carabao</option>
                <option value="Sheep">Sheep</option>
                <option value="Horse">Horse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input required type="text" value={formData.breed} onChange={e => setFormData({...formData, breed: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color/Markings</label>
              <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input required type="number" step="0.01" value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input required type="text" placeholder="e.g. 2 yrs" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select required value={formData.sex} onChange={e => setFormData({...formData, sex: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
              <input type="date" value={formData.birthdate} onChange={e => setFormData({...formData, birthdate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
              <select required value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Meat">Meat</option>
                <option value="Dairy">Dairy</option>
                <option value="Breeding">Breeding</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Acquired</label>
              <input type="date" value={formData.dateAcquired} onChange={e => setFormData({...formData, dateAcquired: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
              <select required value={formData.healthStatus} onChange={e => setFormData({...formData, healthStatus: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Healthy">Healthy</option>
                <option value="Sick">Sick</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source of Animal</label>
              <input type="text" value={formData.sourceOfAnimal} onChange={e => setFormData({...formData, sourceOfAnimal: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Vaccination Date</label>
              <input type="date" value={formData.lastVaccinationDate} onChange={e => setFormData({...formData, lastVaccinationDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="flex items-center gap-2 pb-2">
              <input type="checkbox" checked={formData.isInsured} onChange={e => setFormData({...formData, isInsured: e.target.checked})} className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded" />
              <label className="text-sm font-medium text-gray-700">Is Insured?</label>
            </div>
            {formData.isInsured && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance ID</label>
                <input type="text" value={formData.insuranceId} onChange={e => setFormData({...formData, insuranceId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Livestock" : "Save Livestock"}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Livestock Record</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Are you sure you want to delete the livestock record for <span className="font-bold text-gray-900 uppercase">{livestockToDelete?.tag_id}</span>? This action cannot be undone and will permanently remove this record from the system.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setLivestockToDelete(null);
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
