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
import Schedule from './views/Schedule';
import { supabase } from './lib/supabase';

export type ViewType = 'Dashboard' | 'Farmers' | 'Livestock' | 'Health Services' | 'Program Distribution' | 'Field Inspection' | 'Geotagging & Map' | 'Inventory' | 'Notifications' | 'User Management' | 'Reports' | 'Schedule';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('Staff');
  const [userName, setUserName] = useState<string>('');
  const [activeView, setActiveView] = useState<ViewType>('Dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.email) {
        fetchUserRole(session.user.email);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        fetchUserRole(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('users_management')
        .select('role, name')
        .eq('email', email)
        .single();
      
      if (data) {
        setUserRole(data.role);
        setUserName(data.name);
      } else {
        // Fallback if user not found in users_management
        setUserRole('Admin'); // Defaulting to Admin for the preview if not found to prevent lockout
      }
    } catch (err) {
      console.error('Error fetching user role:', err);
    } finally {
      setLoading(false);
    }
  };

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
      case 'Schedule': return <Schedule />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen print:h-auto bg-gray-100 font-sans text-gray-900">
      <div className="print:hidden h-full">
        <Sidebar activeView={activeView} setActiveView={setActiveView} userRole={userRole} userName={userName || session.user.email} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Header title={activeView} />
        </div>
        <main className={`flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible bg-gray-50 print:p-0 print:bg-white ${activeView === 'Geotagging & Map' ? 'p-0' : 'p-6'}`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}
