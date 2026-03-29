import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, User, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface DistributionLogEntry {
  id: string;
  recipient_id: string;
  item_id: string;
  quantity: number;
  date: string;
  notes: string;
  status: string;
  recipient: { name: string; rsbsa_id: string };
  item: { item_name: string; unit: string };
}

export default function DistributionLog() {
  const [logs, setLogs] = useState<DistributionLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('distributions')
        .select(`
          *,
          recipient:recipients(name, rsbsa_id),
          item:inventory(item_name, unit)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      // Fallback data for preview
      if (logs.length === 0) {
        setLogs([
          {
            id: '1', recipient_id: '1', item_id: '1', quantity: 2, date: '2026-03-28', notes: 'Typhoon relief', status: 'Completed',
            recipient: { name: 'Juan Dela Cruz', rsbsa_id: '01-23-45-001' },
            item: { item_name: 'Chicken Feeds', unit: 'sacks' }
          },
          {
            id: '2', recipient_id: '2', item_id: '2', quantity: 5, date: '2026-03-27', notes: 'Regular dispersal', status: 'Completed',
            recipient: { name: 'Maria Santos', rsbsa_id: '01-23-45-002' },
            item: { item_name: 'Swine Starter', unit: 'sacks' }
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.recipient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.item?.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.recipient?.rsbsa_id.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search logs by farmer or item..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0f9d58] focus:border-[#0f9d58] outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Recipient</th>
                <th className="px-6 py-4 font-medium">Item Distributed</th>
                <th className="px-6 py-4 font-medium">Quantity</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No distribution logs found.</td></tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{log.recipient?.name}</p>
                          <p className="text-xs text-gray-500">{log.recipient?.rsbsa_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 rounded-md text-orange-600">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{log.item?.item_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {log.quantity} <span className="text-gray-500 font-normal">{log.item?.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {log.status || 'Completed'}
                      </span>
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
