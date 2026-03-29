import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Distribute() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const [formData, setFormData] = useState({
    recipient_id: '',
    item_id: '',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, recRes] = await Promise.all([
        supabase.from('inventory').select('*').order('item_name'),
        supabase.from('recipients').select('*').order('name')
      ]);

      setInventory(invRes.data || []);
      setRecipients(recRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback data for preview
      setInventory([
        { id: '1', item_name: 'Chicken Feeds', quantity: 500, unit: 'sacks' },
        { id: '2', item_name: 'Swine Starter', quantity: 200, unit: 'sacks' }
      ]);
      setRecipients([
        { id: '1', name: 'Juan Dela Cruz', rsbsa_id: '01-23-45-001' },
        { id: '2', name: 'Maria Santos', rsbsa_id: '01-23-45-002' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const selectedItem = inventory.find(i => i.id === formData.item_id);
      if (!selectedItem) throw new Error('Item not found');
      if (selectedItem.quantity < formData.quantity) {
        throw new Error(`Insufficient inventory. Only ${selectedItem.quantity} available.`);
      }

      // 1. Insert distribution record
      const { error: distError } = await supabase.from('distributions').insert([{
        recipient_id: formData.recipient_id,
        item_id: formData.item_id,
        quantity: formData.quantity,
        date: formData.date,
        notes: formData.notes,
        status: 'Completed'
      }]);

      if (distError) throw distError;

      // 2. Update inventory quantity
      const { error: invError } = await supabase.from('inventory')
        .update({ quantity: selectedItem.quantity - formData.quantity })
        .eq('id', formData.item_id);

      if (invError) throw invError;

      setMessage({ type: 'success', text: 'Distribution recorded successfully!' });
      setFormData({ ...formData, quantity: 1, notes: '' });
      fetchData(); // Refresh inventory counts
    } catch (error: any) {
      console.error('Error recording distribution:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to record distribution. Ensure tables exist.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading form data...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Record Distribution</h2>
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient (Farmer)</label>
            <select 
              required
              value={formData.recipient_id}
              onChange={e => setFormData({...formData, recipient_id: e.target.value})}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none"
            >
              <option value="">Select a recipient...</option>
              {recipients.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.rsbsa_id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Item</label>
            <select 
              required
              value={formData.item_id}
              onChange={e => setFormData({...formData, item_id: e.target.value})}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none"
            >
              <option value="">Select an item...</option>
              {inventory.map(i => (
                <option key={i.id} value={i.id} disabled={i.quantity <= 0}>
                  {i.item_name} - {i.quantity} {i.unit} available
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input 
                required 
                type="number" 
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                required 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea 
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none resize-none"
              placeholder="Add any additional details here..."
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0f9d58] hover:bg-[#0b8043] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0f9d58] transition-colors disabled:opacity-70"
            >
              {submitting ? 'Recording...' : 'Record Distribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
