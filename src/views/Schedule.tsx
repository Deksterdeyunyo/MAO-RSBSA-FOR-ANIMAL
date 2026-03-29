import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Edit2, Trash2, Clock, MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  program_type: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
}

export default function Schedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    program_type: 'Distribution',
    status: 'Upcoming'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('schedules').select('*').order('date', { ascending: true });
    if (data) setEvents(data);
    if (error) console.error('Error fetching schedules:', error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('schedules').update(formData).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('schedules').insert([formData]);
      error = insertError;
    }
    
    if (!error) {
      closeModal();
      fetchEvents();
    } else {
      console.error('Error saving schedule:', error);
      alert('Failed to save schedule. Please ensure Supabase is configured.');
    }
  };

  const handleEdit = (event: ScheduleEvent) => {
    setFormData({
      title: event.title || '',
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      program_type: event.program_type || 'Distribution',
      status: event.status || 'Upcoming'
    });
    setEditingId(event.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      await supabase.from('schedules').delete().eq('id', id);
      fetchEvents();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', description: '', date: '', time: '', location: '', program_type: 'Distribution', status: 'Upcoming' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Program Schedules</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00965e] text-white px-4 py-2 rounded-lg hover:bg-[#007a4c] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add Schedule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)} mb-2`}>
                  {event.status}
                </span>
                <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                <p className="text-sm text-[#00965e] font-medium">{event.program_type}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(event)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(event.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span>{new Date(event.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-900">No schedules found</p>
            <p>Click "Add Schedule" to create a new program schedule.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Schedule" : "Add New Schedule"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program Title</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
              <select required value={formData.program_type} onChange={e => setFormData({...formData, program_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Distribution">Distribution</option>
                <option value="Training">Training</option>
                <option value="Inspection">Inspection</option>
                <option value="Meeting">Meeting</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#00965e] focus:border-[#00965e]">
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#00965e] text-white rounded-md hover:bg-[#007a4c] transition-colors">
              {editingId ? "Update Schedule" : "Save Schedule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
