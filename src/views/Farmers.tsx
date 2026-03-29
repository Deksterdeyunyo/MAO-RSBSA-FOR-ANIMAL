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
  contact: string;
  farm_area_sqm: number;
  farm_type: string;
  livestock_count: number;
}

export default function Farmers() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    rsbsaId: '', name: '', birthdate: '', gender: 'Male', 
    address: '', contact: '', farmArea: 0, farmType: 'Backyard', livestockCount: 0 
  });

  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    const { data, error } = await supabase.from('farmers').select('*').order('created_at', { ascending: false });
    if (data) setFarmers(data);
    if (error) console.error('Error fetching farmers:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('farmers').insert([{
      rsbsa_id: formData.rsbsaId,
      name: formData.name,
      birthdate: formData.birthdate || null,
      gender: formData.gender,
      address: formData.address,
      contact: formData.contact,
      farm_area_sqm: formData.farmArea,
      farm_type: formData.farmType,
      livestock_count: formData.livestockCount
    }]);
    
    if (!error) {
      setIsModalOpen(false);
      setFormData({ rsbsaId: '', name: '', birthdate: '', gender: 'Male', address: '', contact: '', farmArea: 0, farmType: 'Backyard', livestockCount: 0 });
      fetchFarmers();
    } else {
      console.error('Error adding farmer:', error);
      alert('Failed to add farmer. Please ensure Supabase is configured.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this farmer?')) {
      await supabase.from('farmers').delete().eq('id', id);
      fetchFarmers();
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.rsbsa_id?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{farmer.rsbsa_id}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-semibold">{farmer.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <UserIcon className="w-3 h-3" /> {farmer.gender} • {farmer.birthdate ? new Date(farmer.birthdate).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {farmer.contact}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {farmer.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>{farmer.farm_type}</div>
                    <div className="text-xs">{farmer.farm_area_sqm} sqm</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {farmer.livestock_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Farmer">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input required type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
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
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">Save Farmer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
