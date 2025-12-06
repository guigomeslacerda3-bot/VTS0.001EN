import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Calendar, AlertTriangle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function KPI() {
  const { requests, vehicles, reworkHistory, parkingSnapshots } = useAppContext();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState({ day: '', month: '', year: '' });

  // --- DYNAMIC DATA CALCULATIONS ---

  // 1. Parking Occupancy: 6:00 AM vs Current (15:48 in request context, treated as live)
  // Mocking 6:00 AM data from context snapshots, comparing with current live count
  const parkingOccupancyData = useMemo(() => {
    const currentOccupied = vehicles.filter(v => v.area === 'PARKING').length;
    const morningSnapshot = parkingSnapshots.find(s => s.time === '6:00 AM')?.count || 0;
    
    return [
      { name: 'GWM Parking', '6:00 AM': morningSnapshot, '15:48 PM': currentOccupied },
    ];
  }, [vehicles, parkingSnapshots]);


  // 2. Efficiency: Average Hours per Repair per Shop (Real Data)
  const efficiencyData = useMemo(() => {
    const shopStats: Record<string, { totalSeconds: number, count: number }> = {};
    
    // Process history
    reworkHistory.forEach(record => {
      if (!shopStats[record.shop]) shopStats[record.shop] = { totalSeconds: 0, count: 0 };
      shopStats[record.shop].totalSeconds += record.durationSeconds;
      shopStats[record.shop].count += 1;
    });

    // Targets (Hardcoded as per request)
    const targets: Record<string, number> = {
      'Paint Shop': 4,
      'Body Shop': 2,
      'General Assembly': 1,
      'Quality Technology': 1,
      'R&D': 1
    };

    return Object.keys(targets).map(shop => {
      const stats = shopStats[shop] || { totalSeconds: 0, count: 0 };
      const avgHours = stats.count > 0 ? (stats.totalSeconds / 3600) : 0;
      return {
        name: shop,
        AverageHours: parseFloat(avgHours.toFixed(2)),
        Target: targets[shop]
      };
    });
  }, [reworkHistory]);

  // 3. Pareto Top 10 Part Numbers (Real Data Summation)
  const partParetoData = useMemo(() => {
    const partCounts: Record<string, number> = {};
    requests.forEach(r => {
      partCounts[r.partNumber] = (partCounts[r.partNumber] || 0) + r.quantity;
    });

    return Object.entries(partCounts)
      .map(([name, count]) => ({ name, Requests: count }))
      .sort((a, b) => b.Requests - a.Requests)
      .slice(0, 10);
  }, [requests]);

  // 4. Approved vs Rejected (Aprovadas vs Reprovadas)
  const reqStatusData = useMemo(() => [
    { name: 'Approved (批准)', value: requests.filter(r => r.status === 'approved').length, color: '#3b82f6' },
    { name: 'Rejected (拒绝)', value: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' },
  ], [requests]);


  // Banner Data: Last 3 Approved Requests
  const recentApproved = requests
    .filter(r => r.status === 'approved')
    .sort((a, b) => new Date(b.approvalDate!).getTime() - new Date(a.approvalDate!).getTime())
    .slice(0, 3);

  // Priority Vehicles for Scroller
  const priorityVehicles = vehicles.filter(v => v.priority);

  return (
    <div className="pb-20 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h2 className="text-3xl font-bold text-white">General KPI Dashboard (关键绩效指标仪表板)</h2>
         
         <div className="flex items-center gap-4">
            {/* Date Filters */}
            <div className="flex space-x-2 bg-gwm-card p-2 rounded border border-gray-600">
              <Calendar className="text-gray-400 mr-2" />
              <input type="number" placeholder="Day (日)" className="bg-gray-700 w-16 p-1 rounded text-white" />
              <input type="number" placeholder="Month (月)" className="bg-gray-700 w-16 p-1 rounded text-white" />
              <input type="number" placeholder="Year (年)" className="bg-gray-700 w-20 p-1 rounded text-white" />
              <button className="bg-blue-600 px-3 py-1 rounded text-white text-sm font-bold">Filter (筛选)</button>
            </div>

            <button onClick={() => navigate('/dashboard')} className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold shadow transition-colors">
               <Home className="w-4 h-4 mr-2" /> Main Menu
            </button>
         </div>
      </div>

      {/* Interactive Banner: Approved Requests */}
      <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500 p-4 rounded-lg shadow-lg relative overflow-hidden animate-pulse">
        <div className="flex items-center text-red-400 font-bold mb-2">
           <AlertTriangle className="mr-2" /> LAST APPROVED REQUESTS (PENDING DELIVERY) (最后批准的请求（待交付）)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-red-200 text-sm font-mono">
           {recentApproved.length > 0 ? recentApproved.map(r => (
             <div key={r.id} className="bg-black/20 p-2 rounded border border-red-500/30">
               <div className="font-bold">{r.partName}</div>
               <div>Qty: {r.quantity}</div>
               <div className="text-xs opacity-75">{new Date(r.approvalDate!).toLocaleTimeString()}</div>
             </div>
           )) : (
             <div className="col-span-3 text-center italic opacity-70">No recent approved requests. (没有最近批准的请求。)</div>
           )}
        </div>
      </div>

      {/* Priority Vehicles Scroller */}
      {priorityVehicles.length > 0 && (
         <div className="bg-yellow-900/40 border-y border-yellow-500/50 overflow-hidden py-2 relative">
            <div className="whitespace-nowrap flex animate-marquee space-x-8 items-center px-4">
               <span className="font-bold text-yellow-500 flex items-center sticky left-0 bg-yellow-900/40 pr-2"><AlertTriangle size={16} className="mr-1"/> PRIORITY VEHICLES (优先车辆):</span>
               {priorityVehicles.map(v => (
                  <span key={v.vin} className="text-yellow-200 font-mono text-sm inline-flex items-center">
                    <span className="font-bold bg-yellow-600/30 px-2 rounded mr-1">{v.lane}-{v.spot}</span> 
                    {v.vin} 
                    <span className="text-gray-400 ml-1 text-xs">({v.area})</span>
                  </span>
               ))}
               {/* Duplicate for smooth scroll look if needed, handled by CSS animation normally */}
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. Comparativo Parking */}
        <div className="bg-gwm-card p-4 rounded-lg shadow border border-gray-700 h-80">
          <h3 className="font-bold text-gray-300 mb-2 text-sm">Parking Occupancy (6:00 vs 15:48) (停车占用率)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={parkingOccupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip contentStyle={{backgroundColor: '#1f2937'}} />
              <Legend />
              <Bar dataKey="6:00 AM" fill="#60a5fa" name="6:00 AM (Occupied)" />
              <Bar dataKey="15:48 PM" fill="#34d399" name="15:48 PM (Occupied)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Efficiency vs Target */}
        <div className="bg-gwm-card p-4 rounded-lg shadow border border-gray-700 h-80">
          <h3 className="font-bold text-gray-300 mb-2 text-sm">Efficiency: Average Hours per Repair vs Target (效率：每次维修的平均时间与目标)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={efficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip contentStyle={{backgroundColor: '#1f2937'}} />
              <Legend />
              <Bar dataKey="AverageHours" fill="#f472b6" name="Average Hours" />
              <Bar dataKey="Target" fill="#9ca3af" name="Target Max" opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Pareto Part Numbers */}
        <div className="bg-gwm-card p-4 rounded-lg shadow border border-gray-700 h-80">
          <h3 className="font-bold text-gray-300 mb-2 text-sm">Top 10 Part Numbers (Total Requests) (前 10 个零件编号)</h3>
          <ResponsiveContainer width="100%" height="90%">
             <BarChart data={partParetoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="#9ca3af" fontSize={10} />
              <Tooltip contentStyle={{backgroundColor: '#1f2937'}} />
              <Bar dataKey="Requests" fill="#fbbf24" name="Request Qty" />
             </BarChart>
          </ResponsiveContainer>
        </div>

         {/* 4. Approved vs Rejected */}
         <div className="bg-gwm-card p-4 rounded-lg shadow border border-gray-700 h-80">
           <h3 className="font-bold text-gray-300 mb-2 text-sm">Requests: Approved vs Rejected (请求：批准与拒绝)</h3>
           <ResponsiveContainer width="100%" height="90%">
             <PieChart>
               <Pie data={reqStatusData} dataKey="value" outerRadius={80} label>
                 {reqStatusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
               </Pie>
               <Tooltip contentStyle={{backgroundColor: '#1f2937'}} />
               <Legend />
             </PieChart>
           </ResponsiveContainer>
         </div>

      </div>
      
      {/* CSS for Marquee if not in tailwind config */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}