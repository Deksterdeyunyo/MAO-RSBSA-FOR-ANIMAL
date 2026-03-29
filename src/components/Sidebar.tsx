import React from 'react';
import { Sprout, LayoutDashboard, Users, Dog, Syringe, Package, ClipboardCheck, Map, Bell, UserCog, LogOut, FileText, Box } from 'lucide-react';
import { ViewType } from '../App';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const menuItems: { name: ViewType; icon: React.ElementType }[] = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Farmers', icon: Users },
    { name: 'Livestock', icon: Dog },
    { name: 'Health Services', icon: Syringe },
    { name: 'Program Distribution', icon: Package },
    { name: 'Field Inspection', icon: ClipboardCheck },
    { name: 'Geotagging & Map', icon: Map },
    { name: 'Inventory', icon: Box },
    { name: 'Reports', icon: FileText },
    { name: 'Notifications', icon: Bell },
    { name: 'User Management', icon: UserCog },
  ];

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
        <p className="text-base font-bold text-white mb-2">Kristal Bandalan</p>
        <span className="inline-block px-2 py-1 bg-[#004d33] border border-[#008755] text-emerald-100 text-xs font-semibold rounded">ADMIN</span>
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
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-emerald-50 hover:bg-[#007a50] transition-colors"
        >
          <LogOut className="w-5 h-5 text-emerald-200" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
