import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './views/Dashboard';
import Farmers from './views/Farmers';
import Livestock from './views/Livestock';
import HealthServices from './views/HealthServices';
import ProgramDistribution from './views/ProgramDistribution';
import FieldInspection from './views/FieldInspection';
import Inventory from './views/Inventory';
import Notifications from './views/Notifications';
import UserManagement from './views/UserManagement';
import Login from './views/Login';
import Reports from './views/Reports';
import Schedule from './views/Schedule';
import { supabase } from './lib/supabase';

export type ViewType = 'Dashboard' | 'Farmers' | 'Livestock' | 'Health Services' | 'Program Distribution' | 'Field Inspection' | 'Inventory' | 'Notifications' | 'User Management' | 'Reports' | 'Schedule';

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
        // If user is Encoder, set default view to Farmers
        if (data.role === 'Encoder') {
          setActiveView('Farmers');
        }
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
    // Role-based view protection
    const restrictedViews: Record<string, string[]> = {
      'User Management': ['Admin'],
      'Reports': ['Admin', 'Technician'],
      'Dashboard': ['Admin', 'Technician', 'Staff'],
      'Inventory': ['Admin', 'Technician', 'Staff'],
      'Schedule': ['Admin', 'Technician', 'Staff'],
      'Notifications': ['Admin', 'Technician', 'Staff'],
    };

    const allowedRoles = restrictedViews[activeView];
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>;
    }

    switch (activeView) {
      case 'Dashboard': return <Dashboard />;
      case 'Farmers': return <Farmers userRole={userRole} />;
      case 'Livestock': return <Livestock userRole={userRole} />;
      case 'Health Services': return <HealthServices userRole={userRole} />;
      case 'Program Distribution': return <ProgramDistribution userRole={userRole} />;
      case 'Field Inspection': return <FieldInspection userRole={userRole} />;
      case 'Inventory': return <Inventory userRole={userRole} />;
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
        <main className={`flex-1 overflow-x-hidden overflow-y-auto print:overflow-visible bg-gray-50 print:p-0 print:bg-white p-6`}>
          {renderView()}
        </main>
      </div>
    </div>
  );
}
