import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import Farmers from './views/Farmers';
import Livestock from './views/Livestock';
import HealthServices from './views/HealthServices';
import ProgramDistribution from './views/ProgramDistribution';
import FieldInspection from './views/FieldInspection';
import Geotagging from './views/Geotagging';
import Inventory from './views/Inventory';
import Notifications from './views/Notifications';
import UserManagement from './views/UserManagement';
import Login from './views/Login';
import Reports from './views/Reports';
import { supabase } from './lib/supabase';

export type ViewType = 'Dashboard' | 'Farmers' | 'Livestock' | 'Health Services' | 'Program Distribution' | 'Field Inspection' | 'Geotagging & Map' | 'Inventory' | 'Notifications' | 'User Management' | 'Reports';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [activeView, setActiveView] = useState<ViewType>('Dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'Dashboard': return <Dashboard />;
      case 'Farmers': return <Farmers />;
      case 'Livestock': return <Livestock />;
      case 'Health Services': return <HealthServices />;
      case 'Program Distribution': return <ProgramDistribution />;
      case 'Field Inspection': return <FieldInspection />;
      case 'Geotagging & Map': return <Geotagging />;
      case 'Inventory': return <Inventory />;
      case 'Notifications': return <Notifications />;
      case 'User Management': return <UserManagement />;
      case 'Reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen print:h-auto bg-gray-100 font-sans text-gray-900">
      <div className="print:hidden h-full">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header title={activeView} />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible bg-gray-50 p-6 print:p-0 print:bg-white">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
