import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../App';
import { Wrench, Car, Users, Package, BarChart2, UserCheck, Bell } from 'lucide-react';
import { Role, SCREEN_IDS } from '../types';

export default function Dashboard() {
  const { user, requests } = useAppContext();
  const navigate = useNavigate();

  // Helper to check permission
  const hasAccess = (screenId: string) => {
    if (!user) return false;
    if (user.role === Role.AdminGeral) return true; // Admin has all
    return user.permissions && user.permissions.includes(screenId);
  };

  const menuItems = [
    { 
      id: SCREEN_IDS.BOX_REPAIR,
      title: 'Box Repair (盒子维修)', 
      icon: <Wrench size={48} />, 
      path: '/box-repair',
      color: 'bg-blue-600',
    },
    { 
      id: SCREEN_IDS.PARKING,
      title: 'Parking (停车场)', 
      icon: <Car size={48} />, 
      path: '/parking',
      color: 'bg-indigo-600',
    },
    { 
      id: SCREEN_IDS.REWORKERS,
      title: 'Reworkers (返工人员)', 
      icon: <Users size={48} />, 
      path: '/reworkers',
      color: 'bg-emerald-600',
    },
    { 
      id: SCREEN_IDS.SUPPLY_PARTS,
      title: 'Supply Parts (供应零件)', 
      icon: <Package size={48} />, 
      path: '/supply-parts',
      color: 'bg-orange-600',
    },
    { 
      id: SCREEN_IDS.KPI,
      title: 'KPI (关键绩效指标)', 
      icon: <BarChart2 size={48} />, 
      path: '/kpi',
      color: 'bg-purple-600',
    },
    { 
      id: SCREEN_IDS.USERS,
      title: 'Permission Management (权限管理)', 
      icon: <UserCheck size={48} />, 
      path: '/users',
      color: 'bg-red-600',
    },
  ];

  // Logic for Admin approvals notification
  const pendingApprovals = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: 'url("https://wallpapers.com/images/featured/haval-089etj9zc9genyvy.jpg")' }}
      >
         <div className="absolute inset-0 bg-gray-900 bg-opacity-80"></div>
      </div>

      <div className="relative z-10 p-6 md:p-12 h-full flex flex-col items-center overflow-y-auto">
        <h1 className="text-4xl font-extrabold text-white mb-8 tracking-wider text-center">
          GWM Vehicle Traceability System
          <span className="block text-2xl font-normal text-gwm-accent mt-2">(GWM 车辆追溯系统)</span>
        </h1>

        {/* Notification Area */}
        <div className="w-full max-w-4xl bg-gray-800/80 backdrop-blur border border-gray-600 rounded-lg p-4 mb-8 flex items-start space-x-4">
          <Bell className="text-yellow-400 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">Notifications (通知)</h3>
            <p className="text-sm text-gray-300">
              {pendingApprovals > 0 
                ? `There are ${pendingApprovals} new pending requests. (有 ${pendingApprovals} 个新的待处理请求)` 
                : 'No new notifications. (没有新通知)'}
            </p>
          </div>
        </div>

        {/* Approval Area for Admin */}
        {hasAccess(SCREEN_IDS.USERS) && (
           <div className="w-full max-w-4xl mb-8 flex justify-end">
             <button 
                onClick={() => navigate('/users')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg transform hover:scale-105 transition-all flex items-center"
             >
               <UserCheck className="mr-2" />
               Request / User Approval (批准请求/用户)
             </button>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl pb-12">
          {menuItems.map((item, index) => (
             hasAccess(item.id) && (
              <div 
                key={index}
                onClick={() => navigate(item.path)}
                className={`${item.color} p-8 rounded-xl shadow-xl cursor-pointer transform hover:-translate-y-2 hover:brightness-110 transition-all duration-300 flex flex-col items-center justify-center text-center h-48 border border-white/10 group`}
              >
                <div className="text-white mb-4 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}