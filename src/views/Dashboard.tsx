import React, { useState, useEffect } from 'react';
import { Users, Dog, Syringe, Package, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({ farmers: 0, livestock: 0, health: 0, programs: 0 });
  const [livestockData, setLivestockData] = useState<{name: string, count: number}[]>([]);
  const [healthData, setHealthData] = useState<{name: string, vaccinations: number, treatments: number}[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counts
      const [
        { count: farmersCount },
        { data: livestock },
        { data: health },
        { count: programsCount },
        { data: notifications }
      ] = await Promise.all([
        supabase.from('farmers').select('*', { count: 'exact', head: true }),
        supabase.from('livestock').select('species'),
        supabase.from('health_records').select('date, type'),
        supabase.from('distributions').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        farmers: farmersCount || 0,
        livestock: livestock?.length || 0,
        health: health?.length || 0,
        programs: programsCount || 0
      });

      // Process Livestock Chart Data
      if (livestock && livestock.length > 0) {
        const speciesCount = livestock.reduce((acc: any, curr) => {
          acc[curr.species] = (acc[curr.species] || 0) + 1;
          return acc;
        }, {});
        setLivestockData(Object.keys(speciesCount).map(k => ({ name: k, count: speciesCount[k] })));
      } else {
        setLivestockData([]);
      }

      // Process Health Chart Data (Group by month)
      if (health && health.length > 0) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const healthByMonth = health.reduce((acc: any, curr) => {
          if (!curr.date) return acc;
          const month = monthNames[new Date(curr.date).getMonth()];
          if (!acc[month]) acc[month] = { name: month, vaccinations: 0, treatments: 0 };
          if (curr.type === 'Vaccination') acc[month].vaccinations += 1;
          if (curr.type === 'Treatment') acc[month].treatments += 1;
          return acc;
        }, {});
        setHealthData(Object.values(healthByMonth));
      } else {
        setHealthData([]);
      }

      if (notifications && notifications.length > 0) {
        setAlerts(notifications);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Farmers', value: stats.farmers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Livestock', value: stats.livestock, icon: Dog, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Health Services', value: stats.health, icon: Syringe, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Programs Distributed', value: stats.programs, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Health Services Overview</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80 flex items-center justify-center">
            {healthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="vaccinations" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="treatments" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No health records data available yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Livestock Population</h2>
            <Dog className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-80 flex items-center justify-center">
            {livestockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={livestockData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm">No livestock data available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Alerts & Notifications</h2>
          <button className="text-sm text-[#00965e] font-medium hover:text-[#007a4c]">View All</button>
        </div>
        <div className="space-y-4">
          {alerts.length > 0 ? alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <div className={`p-2 rounded-full ${
                alert.type === 'warning' ? 'bg-red-100 text-red-600' :
                alert.type === 'success' ? 'bg-green-100 text-green-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
              <span className="text-xs text-gray-400">{new Date(alert.created_at).toLocaleDateString()}</span>
            </div>
          )) : (
            <p className="text-gray-500 text-sm text-center py-4">No recent notifications.</p>
          )}
        </div>
      </div>
    </div>
  );
}
