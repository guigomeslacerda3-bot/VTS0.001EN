
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Role, User, Vehicle, PartRequest, BOMItem, ReworkRecord } from './types';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoxRepair from './pages/BoxRepair';
import Parking from './pages/Parking';
import Reworkers from './pages/Reworkers';
import SupplyParts from './pages/SupplyParts';
import KPI from './pages/KPI';
import UserManagement from './pages/UserManagement';

// --- Contexts ---
interface AppContextType {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  requests: PartRequest[];
  setRequests: React.Dispatch<React.SetStateAction<PartRequest[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  bomData: BOMItem[];
  setBomData: React.Dispatch<React.SetStateAction<BOMItem[]>>;
  reworkHistory: ReworkRecord[];
  setReworkHistory: React.Dispatch<React.SetStateAction<ReworkRecord[]>>;
  parkingSnapshots: { time: string, count: number }[];
  refreshData: () => void; // Function to force re-fetch from DB
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gwm-dark text-white font-sans selection:bg-gwm-accent selection:text-white flex flex-col">
      {user && (
        <nav className="bg-gwm-card border-b border-gray-700 p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg h-[73px]">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="font-bold text-xl tracking-tight text-gwm-accent">
              VTS <span className="text-gray-400 text-sm font-normal">GWM Vehicle Traceability System (GWM 车辆追溯系统)</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold">{user.username}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
            <button 
              onClick={() => { logout(); navigate('/'); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors font-medium"
            >
              Logout (退出)
            </button>
          </div>
        </nav>
      )}
      <main className={`flex-grow ${isDashboard ? 'w-full h-[calc(100vh-73px)]' : 'p-4 md:p-6 max-w-7xl mx-auto w-full'}`}>
        {children}
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { user } = useAppContext();
  
  if (!user) return <Navigate to="/" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== Role.AdminGeral) {
     return <div className="text-center text-red-500 mt-10 text-xl">Access Denied (拒绝访问)</div>;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Database States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reworkHistory, setReworkHistory] = useState<ReworkRecord[]>([]);
  
  // Local only (simulated for BOM as it is a file upload)
  const [bomData, setBomData] = useState<BOMItem[]>([]);
  
  // Mock snapshots for KPI (Keep as mock for now or create a DB table for snapshots later)
  const [parkingSnapshots] = useState([
    { time: '6:00 AM', count: 12 }, 
  ]);

  // --- Supabase Data Fetching ---
  const fetchData = async () => {
    try {
      // 1. Fetch Users
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      if (usersData) setUsers(usersData);
      if (usersError) console.error("Error fetching users:", usersError);

      // 2. Fetch Vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');
      if (vehiclesData) setVehicles(vehiclesData);
      if (vehiclesError) console.error("Error fetching vehicles:", vehiclesError);

      // 3. Fetch Requests
      const { data: requestsData, error: requestsError } = await supabase.from('requests').select('*');
      if (requestsData) setRequests(requestsData);
      if (requestsError) console.error("Error fetching requests:", requestsError);

      // 4. Fetch History
      const { data: historyData, error: historyError } = await supabase.from('rework_history').select('*');
      if (historyData) setReworkHistory(historyData);
      if (historyError) console.error("Error fetching history:", historyError);

    } catch (error) {
      console.error("System error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const login = (u: User) => setUser(u);
  const logout = () => setUser(null);

  const SUPPLY_PARTS_ROLES = [
    Role.AdminGeral,
    Role.AnalistaLogistica,
    Role.SupervisorLogistica,
    Role.CoordenadorLogistica,
    Role.LiderLogisticaI,
    Role.LiderLogisticaII,
    Role.LiderLogistica,
    Role.OperadorLogistica,
    Role.Reparador,
    Role.GroupLeaderReparo,
    Role.LiderReparo,
    Role.SupervisorAssembly
  ];

  if (loading) {
    return <div className="min-h-screen bg-gwm-dark flex items-center justify-center text-white">Loading System... (正在加载系统...)</div>;
  }

  return (
    <AppContext.Provider value={{ 
      user, login, logout, 
      vehicles, setVehicles, 
      requests, setRequests, 
      users, setUsers, 
      bomData, setBomData, 
      reworkHistory, setReworkHistory, 
      parkingSnapshots,
      refreshData: fetchData
    }}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/box-repair" element={<ProtectedRoute><BoxRepair /></ProtectedRoute>} />
          <Route path="/parking" element={<ProtectedRoute><Parking /></ProtectedRoute>} />
          <Route path="/reworkers" element={<ProtectedRoute><Reworkers /></ProtectedRoute>} />
          
          <Route path="/supply-parts" element={
            <ProtectedRoute allowedRoles={SUPPLY_PARTS_ROLES}>
              <SupplyParts />
            </ProtectedRoute>
          } />
          
          <Route path="/kpi" element={<ProtectedRoute allowedRoles={[Role.AdminGeral, Role.SupervisorLogistica]}><KPI /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={[Role.AdminGeral]}><UserManagement /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
}
