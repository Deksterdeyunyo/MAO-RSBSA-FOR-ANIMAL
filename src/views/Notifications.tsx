import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (data) setNotifications(data);
    if (error) console.error('Error fetching notifications:', error);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white';
    switch(type) {
      case 'info': return 'bg-blue-50';
      case 'warning': return 'bg-red-50';
      case 'success': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-gray-500 mt-1">You have {unreadCount} unread messages.</p>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm font-medium text-[#00965e] hover:text-[#007a4c] bg-green-50 px-4 py-2 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-6 flex gap-4 transition-colors ${getBgColor(notification.type, notification.read)} hover:bg-gray-50`}
            >
              <div className="shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notification.title}
                  </h3>
                  <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap ml-4">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                  {notification.message}
                </p>
                {!notification.read && (
                  <button 
                    onClick={() => markAsRead(notification.id)}
                    className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              {!notification.read && (
                <div className="shrink-0 flex items-center">
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No notifications to show.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
