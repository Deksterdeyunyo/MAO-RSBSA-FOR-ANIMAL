import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface Farmer {
  id: string;
  rsbsa_id: string;
  name: string;
  birthdate: string;
  gender: string;
  address: string;
  barangay: string;
  contact: string;
  civil_status: string;
  education: string;
  household_size: number;
  is_ar_beneficiary: boolean;
  is_ip: boolean;
  farm_area_sqm: number;
  farm_type: string;
  livestock_count: number;
  latitude?: number;
  longitude?: number;
  livestock_breakdown?: { [key: string]: number };
}

export default function Farmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLivestockModalOpen, setIsLivestockModalOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [farmerLivestock, setFarmerLivestock] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    rsbsaId: '', name: '', birthdate: '', gender: 'Male', 
    address: '', barangay: '', contact: '', 
    civilStatus: 'Single', education: 'Elementary', householdSize: 1,
    isArBeneficiary: false, isIp: false,
    farmArea: 0, farmType: 'Backyard', livestockCount: 0,
    latitude: 0, longitude: 0
  });

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    const { data: farmersData, error: farmersError } = await supabase.from('farmers').select('*').order('created_at', { ascending: false });
    const { data: livestockData, error: livestockError } = await supabase.from('livestock').select('farmer_name, species');

    if (farmersData) {
      const enrichedFarmers = farmersData.map(farmer => {
        const breakdown: { [key: string]: number } = {};
        livestockData?.filter(l => l.farmer_name === farmer.name).forEach(l => {
          breakdown[l.species] = (breakdown[l.species] || 0) + 1;
        });
        return { ...farmer, livestock_breakdown: breakdown };
      });
      setFarmers(enrichedFarmers);
    }
    if (farmersError) console.error('Error fetching farmers:', farmersError);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      rsbsa_id: formData.rsbsaId,
      name: formData.name,
      birthdate: formData.birthdate || null,
      gender: formData.gender,
      address: formData.address,
      barangay: formData.barangay,
      contact: formData.contact,
      civil_status: formData.civilStatus,
      education: formData.education,
      household_size: formData.householdSize,
      is_ar_beneficiary: formData.isArBeneficiary,
      is_ip: formData.isIp,
      farm_area_sqm: formData.farmArea,
      farm_type: formData.farmType,
      livestock_count: formData.livestockCount,
      latitude: formData.latitude || 0,
      longitude: formData.longitude || 0
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('farmers').update(payload).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('farmers').insert([payload]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchFarmers();
    } else {
      console.error('Error saving farmer:', error);
      alert('Failed to save farmer. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (farmer: Farmer) => {
    setFormData({
      rsbsaId: farmer.rsbsa_id || '',
      name: farmer.name || '',
      birthdate: farmer.birthdate || '',
      gender: farmer.gender || 'Male',
      address: farmer.address || '',
      barangay: farmer.barangay || '',
      contact: farmer.contact || '',
      civilStatus: farmer.civil_status || 'Single',
      education: farmer.education || 'Elementary',
      householdSize: farmer.household_size || 1,
      isArBeneficiary: !!farmer.is_ar_beneficiary,
      isIp: !!farmer.is_ip,
      farmArea: farmer.farm_area_sqm || 0,
      farmType: farmer.farm_type || 'Backyard',
      livestockCount: farmer.livestock_count || 0,
      latitude: farmer.latitude || 0,
      longitude: farmer.longitude || 0
    });
    setEditingId(farmer.id);
    setIsModalOpen(true);
  };

  const handleViewLivestock = async (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    const { data, error } = await supabase
      .from('livestock')
      .select('*')
      .eq('farmer_name', farmer.name);
    
    if (data) {
      setFarmerLivestock(data);
      setIsLivestockModalOpen(true);
    }
    if (error) console.error('Error fetching farmer livestock:', error);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this farmer?')) {
      await supabase.from('farmers').delete().eq('id', id);
      fetchFarmers();
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected farmers?`)) {
      const { error } = await supabase.from('farmers').delete().in('id', selectedIds);
      if (!error) {
        setSelectedIds([]);
        fetchFarmers();
      } else {
        console.error('Error in bulk delete:', error);
        alert('Failed to delete some records.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredFarmers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFarmers.map(f => f.id));
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
      rsbsaId: '', name: '', birthdate: '', gender: 'Male', 
      address: '', barangay: '', contact: '', 
      civilStatus: 'Single', education: 'Elementary', householdSize: 1,
      isArBeneficiary: false, isIp: false,
      farmArea: 0, farmType: 'Backyard', livestockCount: 0,
      latitude: 0, longitude: 0
    });
  };

  const filteredFarmers = farmers.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.rsbsa_id?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search farmers by name or RSBSA ID..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00965e] focus:border-[#00965e] outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 animate-in fade-in slide-in-from-left-2">
              <span className="text-sm font-bold text-red-700">{selectedIds.length} selected</span>
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Farmer</span>
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
                    checked={selectedIds.length === filteredFarmers.length && filteredFarmers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-medium">RSBSA ID</th>
                <th className="px-6 py-4 font-medium">Farmer Details</th>
                <th className="px-6 py-4 font-medium">Contact & Location</th>
                <th className="px-6 py-4 font-medium">Farm Info</th>
                <th className="px-6 py-4 font-medium text-center">Livestock</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFarmers.map((farmer) => (
                <tr key={farmer.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(farmer.id) ? 'bg-green-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded cursor-pointer"
                      checked={selectedIds.includes(farmer.id)}
                      onChange={() => toggleSelect(farmer.id)}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{farmer.rsbsa_id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-semibold">{farmer.name}</div>
                    <div className="text-xs text-gray-500 flex flex-col gap-0.5 mt-1">
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" /> {farmer.gender} • {farmer.birthdate ? new Date(farmer.birthdate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {farmer.civil_status} • {farmer.education}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {farmer.contact}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-col">
                        <span>{farmer.address}</span>
                        <span className="text-[10px] font-bold text-[#00965e] uppercase tracking-tighter">Brgy: {farmer.barangay}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{farmer.farm_type}</div>
                    <div className="text-xs">{farmer.farm_area_sqm} sqm</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                        Total: {farmer.livestock_count}
                      </span>
                      {farmer.livestock_breakdown && Object.entries(farmer.livestock_breakdown).length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          {Object.entries(farmer.livestock_breakdown).map(([species, count]) => (
                            <span key={species} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">
                              {species}: {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewLivestock(farmer)} className="p-1.5 text-[#00965e] hover:bg-green-50 rounded-md transition-colors" title="View Livestock">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(farmer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(farmer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFarmers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No farmers found matching your search. Add a new farmer to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Farmer" : "Add New Farmer"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RSBSA ID</label>
              <input required type="text" value={formData.rsbsaId} onChange={e => setFormData({...formData, rsbsaId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthdate</label>
              <input type="date" value={formData.birthdate} onChange={e => setFormData({...formData, birthdate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
              <input required type="text" value={formData.barangay} onChange={e => setFormData({...formData, barangay: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status</label>
              <select required value={formData.civilStatus} onChange={e => setFormData({...formData, civilStatus: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
              <select required value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Elementary">Elementary</option>
                <option value="High School">High School</option>
                <option value="College">College</option>
                <option value="Post-Graduate">Post-Graduate</option>
                <option value="None">None</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HH Size</label>
              <input required type="number" min="1" value={formData.householdSize} onChange={e => setFormData({...formData, householdSize: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="flex gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isArBeneficiary} onChange={e => setFormData({...formData, isArBeneficiary: e.target.checked})} className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">AR Beneficiary</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.isIp} onChange={e => setFormData({...formData, isIp: e.target.checked})} className="w-4 h-4 text-[#00965e] focus:ring-[#00965e] border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">IP Member</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input required type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livestock Count</label>
              <input required type="number" min="0" value={formData.livestockCount} onChange={e => setFormData({...formData, livestockCount: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Area (sqm)</label>
              <input required type="number" min="0" value={formData.farmArea} onChange={e => setFormData({...formData, farmArea: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm Type</label>
              <select required value={formData.farmType} onChange={e => setFormData({...formData, farmType: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Backyard">Backyard</option>
                <option value="Commercial">Commercial</option>
                <option value="Semi-Commercial">Semi-Commercial</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Farmer" : "Save Farmer"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isLivestockModalOpen} onClose={() => setIsLivestockModalOpen(false)} title={`Livestock for ${selectedFarmer?.name}`}>
        <div className="space-y-4">
          {farmerLivestock.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {farmerLivestock.map((animal) => (
                <div key={animal.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-[#00965e] uppercase tracking-wider">Tag: {animal.tag_id}</span>
                      <h4 className="text-lg font-bold text-gray-900">{animal.species} - {animal.breed}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      animal.status === 'Healthy' ? 'bg-green-100 text-green-800' : 
                      animal.status === 'Sick' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {animal.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Gender: <span className="text-gray-900 font-medium">{animal.sex}</span></div>
                    <div className="text-gray-500">Weight: <span className="text-gray-900 font-medium">{animal.weight_kg} kg</span></div>
                    <div className="text-gray-500">Purpose: <span className="text-gray-900 font-medium">{animal.purpose}</span></div>
                    <div className="text-gray-500">Color: <span className="text-gray-900 font-medium">{animal.color}</span></div>
                    <div className="text-gray-500">Health: <span className="text-gray-900 font-medium">{animal.health_status}</span></div>
                    <div className="text-gray-500">Vax: <span className="text-gray-900 font-medium">{animal.vaccination_status}</span></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No livestock records found for this farmer.
            </div>
          )}
          <div className="pt-4 flex justify-end">
            <button onClick={() => setIsLivestockModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
