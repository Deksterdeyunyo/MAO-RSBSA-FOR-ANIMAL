import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Recipient {
  id: string;
  rsbsa_id: string;
  name: string;
  address: string;
  contact: string;
}

export default function Recipients() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Recipient>>({});

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('recipients').select('*').order('name');
      if (error) throw error;
      setRecipients(data || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      // Fallback for preview
      if (recipients.length === 0) {
        setRecipients([
          { id: '1', rsbsa_id: '01-23-45-001', name: 'Juan Dela Cruz', address: 'Brgy. San Jose', contact: '09123456789' },
          { id: '2', rsbsa_id: '01-23-45-002', name: 'Maria Santos', address: 'Brgy. Poblacion', contact: '09987654321' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        const { error } = await supabase.from('recipients').update(formData).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recipients').insert([formData]);
        if (error) throw error;
      }
      setShowForm(false);
      setFormData({});
      fetchRecipients();
    } catch (error) {
      console.error('Error saving recipient:', error);
      alert('Failed to save recipient. Ensure Supabase is connected and table exists.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipient?')) return;
    try {
      const { error } = await supabase.from('recipients').delete().eq('id', id);
      if (error) throw error;
      fetchRecipients();
    } catch (error) {
      console.error('Error deleting recipient:', error);
      alert('Failed to delete recipient.');
    }
  };

  const filteredRecipients = recipients.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.rsbsa_id?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search recipients by name or RSBSA ID..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setFormData({}); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#0f9d58] text-white px-4 py-2 rounded-lg hover:bg-[#0b8043] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Recipient</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">{formData.id ? 'Edit Recipient' : 'Add New Recipient'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RSBSA ID</label>
              <input required type="text" value={formData.rsbsa_id || ''} onChange={e => setFormData({...formData, rsbsa_id: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input required type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input required type="text" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full p-2 border rounded-md" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
              <button type="submit" className="px-4 py-2 text-white bg-[#0f9d58] rounded-md hover:bg-[#0b8043]">Save Recipient</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">RSBSA ID</th>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Address</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading recipients...</td></tr>
              ) : filteredRecipients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No recipients found.</td></tr>
              ) : (
                filteredRecipients.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{recipient.rsbsa_id}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{recipient.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {recipient.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {recipient.contact}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setFormData(recipient); setShowForm(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(recipient.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
