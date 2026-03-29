import React, { useState } from 'react';
import { Sprout, LayoutDashboard, Users, Dog, Syringe, Package, ClipboardCheck, Map, Bell, UserCog, LogOut, FileText, Box, Calendar, AlertCircle } from 'lucide-react';
import { ViewType } from '../App';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Modal from './Modal';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ activeView, setActiveView, userRole = 'Staff', userName = 'User' }: SidebarProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const allMenuItems: { name: ViewType; icon: React.ElementType; roles: string[] }[] = [
    { name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Technician', 'Staff'] },
    { name: 'Farmers', icon: Users, roles: ['Admin', 'Technician', 'Staff', 'Encoder'] },
    { name: 'Livestock', icon: Dog, roles: ['Admin', 'Technician', 'Staff', 'Encoder'] },
    { name: 'Health Services', icon: Syringe, roles: ['Admin', 'Technician', 'Staff', 'Encoder'] },
    { name: 'Program Distribution', icon: Package, roles: ['Admin', 'Technician', 'Staff', 'Encoder'] },
    { name: 'Field Inspection', icon: ClipboardCheck, roles: ['Admin', 'Technician', 'Staff', 'Encoder'] },
    { name: 'Geotagging & Map', icon: Map, roles: ['Admin', 'Technician', 'Staff'] },
    { name: 'Inventory', icon: Box, roles: ['Admin', 'Technician', 'Staff'] },
    { name: 'Schedule', icon: Calendar, roles: ['Admin', 'Technician', 'Staff'] },
    { name: 'Reports', icon: FileText, roles: ['Admin', 'Technician'] },
    { name: 'Notifications', icon: Bell, roles: ['Admin', 'Technician', 'Staff'] },
    { name: 'User Management', icon: UserCog, roles: ['Admin'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-64 bg-[#006442] text-white flex flex-col h-full shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <Sprout className="w-8 h-8 text-white" />
        <h1 className="text-white font-bold text-xl tracking-wide">MAO RSBSA</h1>
      </div>
      
      <div className="px-6 pb-6">
        <p className="text-sm text-emerald-100">Welcome,</p>
        <p className="text-base font-bold text-white mb-2 truncate" title={userName}>{userName}</p>
        <span className="inline-block px-2 py-1 bg-[#004d33] border border-[#008755] text-emerald-100 text-xs font-semibold rounded uppercase">{userRole}</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.name;
            return (
              <li key={item.name}>
                <button
                  onClick={() => setActiveView(item.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive 
                      ? "bg-[#008755] text-white" 
                      : "text-emerald-50 hover:bg-[#007a50]"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-emerald-200")} />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-[#007a50]">
        <button 
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-emerald-50 hover:bg-[#007a50] transition-colors"
        >
          <LogOut className="w-5 h-5 text-emerald-200" />
          Sign Out
        </button>
      </div>

      <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Confirm Sign Out">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertCircle className="w-6 h-6" />
            <p className="font-medium">Are you sure you want to sign out?</p>
          </div>
          <p className="text-sm text-gray-500">You will need to log in again to access the system.</p>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              No, Stay
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Yes, Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
