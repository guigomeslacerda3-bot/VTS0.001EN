import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import { Play, Pause, Square, User as UserIcon, MapPin, Clock, Home, ArrowLeft, CheckCircle, Download } from 'lucide-react';
import { Role, ReworkRecord, SHOPS } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Reworkers() {
  const { user, users, reworkHistory, refreshData } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'WORK' | 'MONITOR'>('WORK');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentVin, setCurrentVin] = useState('');
  const [selectedShop, setSelectedShop] = useState<string>(SHOPS[0]);
  
  const [filterDate, setFilterDate] = useState({ day: '', month: '', year: '' });
  const [selectedReworker, setSelectedReworker] = useState<any | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    setIsRunning(false);
    if (!currentVin) return;

    const newRecord: ReworkRecord = {
      id: Math.random().toString(36).substr(2, 9),
      vin: currentVin,
      shop: selectedShop,
      durationSeconds: timer,
      date: new Date().toISOString(),
      technician: user?.username || 'Unknown',
      status: 'completed'
    };
    
    // DB Insert
    const { error } = await supabase.from('rework_history').insert([newRecord]);
    if (error) {
       alert('Error saving history: ' + error.message);
    } else {
       await refreshData();
       alert('Repair Finished Successfully and saved to history! (修复已完成并保存到历史记录！)');
    }

    setTimer(0);
    setCurrentVin('');
  };

  const handleStop = () => {
    setIsRunning(false);
    const reason = prompt('Reason for pause/cancel (原因):');
    if (currentVin && reason) {
        // Optional log logic
    }
  };

  const handleExport = () => {
    const headers = ["ID", "VIN", "Shop", "Duration (s)", "Date", "Technician", "Status"];
    const rows = reworkHistory.map(r => [
      r.id, r.vin, r.shop, r.durationSeconds, r.date, r.technician, r.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Rework_History.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateEfficiency = (durationSec: number, shopName: string) => {
    let targetHours = 1;
    if (shopName.includes('Paint')) targetHours = 4;
    else if (shopName.includes('Body')) targetHours = 2;
    
    const targetSeconds = targetHours * 3600;
    const ratio = durationSec / targetSeconds;
    const percentage = ratio * 100;
    
    return {
       val: percentage.toFixed(1),
       label: `${percentage.toFixed(1)}% (Target: ${targetHours}h)`,
       isOver: percentage > 100
    };
  };

  // Mock data for Admin Monitoring - Needs real implementation later
  const activeReworkers = [
    { id: 'u1', name: 'João Silva', role: 'Reparador', vin: 'GWM123...890', shop: 'Paint Shop', time: 3450, status: 'Active' },
    { id: 'u2', name: 'Maria Liu', role: 'Reparador', vin: 'GWM987...123', shop: 'Body Shop', time: 7300, status: 'Active' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
       <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
         <h2 className="text-2xl font-bold flex items-center">
            <UserIcon className="mr-2" /> Reworkers (返工人员)
         </h2>
         <div className="flex gap-2 items-center">
             {user?.role === Role.AdminGeral && (
               <div className="flex bg-gray-700 rounded p-1 mr-4">
                 <button onClick={() => setActiveTab('WORK')} className={`px-4 py-1 rounded text-sm ${activeTab === 'WORK' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>My Station (我的车站)</button>
                 <button onClick={() => setActiveTab('MONITOR')} className={`px-4 py-1 rounded text-sm ${activeTab === 'MONITOR' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Monitoring (监控)</button>
               </div>
             )}
            <button onClick={() => navigate('/dashboard')} className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold shadow transition-colors">
               <Home className="w-4 h-4 mr-2" /> Main Menu
            </button>
         </div>
       </div>
       
       {activeTab === 'WORK' && (
         <>
           <div className="bg-gwm-card p-8 rounded-xl border border-gray-700 text-center shadow-2xl mb-8">
             <div className="mb-6 space-y-4">
               <div>
                 <label className="block text-gray-400 text-sm mb-2">Responsible Shop (负责商店)</label>
                 <select 
                   value={selectedShop} 
                   onChange={e => setSelectedShop(e.target.value)}
                   disabled={isRunning}
                   className="bg-gray-800 p-2 rounded border border-gray-600 text-white w-full max-w-md mx-auto block focus:ring-2 focus:ring-blue-500"
                 >
                   {SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
               </div>

               <div>
                 <label className="block text-gray-400 text-sm mb-2">VIN in Repair (VIN 在维修中)</label>
                 <input 
                   className="bg-gray-800 text-2xl text-center p-3 rounded border border-gray-600 w-full text-white font-mono tracking-widest max-w-md mx-auto block focus:ring-2 focus:ring-blue-500 focus:outline-none"
                   placeholder="SCAN VIN"
                   value={currentVin}
                   onChange={e => setCurrentVin(e.target.value.toUpperCase())}
                   maxLength={17}
                   disabled={isRunning}
                 />
               </div>
             </div>

             <div className="text-6xl font-mono font-bold text-blue-400 mb-8 tabular-nums">
               {formatTime(timer)}
             </div>

             <div className="flex justify-center space-x-6">
               {!isRunning ? (
                 <button 
                    onClick={() => setIsRunning(true)} 
                    disabled={!currentVin}
                    className="w-24 h-24 rounded-full bg-green-600 hover:bg-green-500 flex flex-col items-center justify-center text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-4 border-green-700"
                 >
                   <Play size={32} />
                   <span className="text-xs mt-1 font-bold">START</span>
                 </button>
               ) : (
                 <button 
                    onClick={() => setIsRunning(false)} 
                    className="w-24 h-24 rounded-full bg-yellow-600 hover:bg-yellow-500 flex flex-col items-center justify-center text-white transition-transform hover:scale-105 shadow-lg border-4 border-yellow-700"
                 >
                   <Pause size={32} />
                   <span className="text-xs mt-1 font-bold">PAUSE</span>
                 </button>
               )}
               
               <button 
                  onClick={handleFinish}
                  disabled={timer === 0 && !isRunning}
                  className="w-24 h-24 rounded-full bg-blue-600 hover:bg-blue-500 flex flex-col items-center justify-center text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-4 border-blue-700"
               >
                 <CheckCircle size={32} />
                 <span className="text-xs mt-1 font-bold">FINISH</span>
               </button>

               <button 
                  onClick={handleStop}
                  disabled={timer === 0}
                  className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-500 flex flex-col items-center justify-center text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-4 border-red-700"
               >
                 <Square size={32} />
                 <span className="text-xs mt-1 font-bold">CANCEL</span>
               </button>
             </div>
           </div>

           <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-400">My History Today (我今天的历史)</h3>
                <div className="flex space-x-1 items-center">
                   <button onClick={handleExport} className="flex items-center bg-green-700 px-2 py-1 rounded text-xs font-bold mr-4">
                       <Download size={12} className="mr-1"/> Export
                   </button>
                </div>
             </div>
             
             {reworkHistory.length === 0 ? (
                <div className="text-sm text-gray-500 italic p-4 text-center border-t border-gray-700">No repairs finished yet. (尚未完成维修。)</div>
             ) : (
                <div className="overflow-auto max-h-60">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-gray-900 text-gray-400">
                       <tr>
                         <th className="p-2">Date (日期)</th>
                         <th className="p-2">Shop</th>
                         <th className="p-2">VIN</th>
                         <th className="p-2">Time (时间)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-700">
                       {reworkHistory.map(r => (
                         <tr key={r.id}>
                           <td className="p-2">{new Date(r.date).toLocaleString()}</td>
                           <td className="p-2">{r.shop}</td>
                           <td className="p-2">{r.vin}</td>
                           <td className="p-2 font-mono">{formatTime(r.durationSeconds)}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             )}
           </div>
         </>
       )}

       {activeTab === 'MONITOR' && user?.role === Role.AdminGeral && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {activeReworkers.map(rw => (
             <div 
               key={rw.id} 
               onClick={() => setSelectedReworker(rw)}
               className="bg-gwm-card p-4 rounded-lg border border-gray-600 hover:border-blue-500 cursor-pointer transition-all shadow-lg relative overflow-hidden group"
             >
               <div className={`absolute top-0 left-0 w-1 h-full ${rw.status === 'Active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
               <div className="flex items-center mb-4 pl-3">
                 <div className="p-3 bg-gray-700 rounded-full mr-3 group-hover:bg-blue-600 transition-colors">
                   <UserIcon size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">{rw.name}</h3>
                   <div className="text-xs text-gray-400 flex items-center">
                     <MapPin size={12} className="mr-1" /> {rw.shop}
                   </div>
                 </div>
               </div>
               
               <div className="pl-3 space-y-2">
                 <div className="text-sm">
                   <span className="text-gray-400">VIN:</span> <span className="font-mono">{rw.vin}</span>
                 </div>
                 <div className="text-sm flex items-center justify-between">
                    <span className="flex items-center">
                        <Clock size={14} className="mr-1 text-blue-400" />
                        <span className="font-mono font-bold text-xl">{formatTime(rw.time)}</span>
                    </span>
                 </div>
               </div>

               {rw.status === 'Active' && (
                 <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
               )}
             </div>
           ))}
         </div>
       )}

       {selectedReworker && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
           <div className="bg-gwm-card p-6 rounded-lg w-full max-w-lg border border-gray-500">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="text-2xl font-bold">{selectedReworker.name}</h3>
                 <p className="text-blue-400">{selectedReworker.shop} - {selectedReworker.role}</p>
               </div>
               <button onClick={() => setSelectedReworker(null)} className="text-gray-400 hover:text-white"><Square size={20}/></button>
             </div>
             
             {(() => {
                const eff = calculateEfficiency(selectedReworker.time, selectedReworker.shop);
                return (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 p-3 rounded col-span-2">
                      <div className="text-gray-400 text-xs">Efficiency (Time/Target) (效率)</div>
                      <div className={`text-2xl font-bold ${eff.isOver ? 'text-red-400' : 'text-green-400'}`}>
                         {eff.label}
                      </div>
                    </div>
                  </div>
                );
             })()}
             <button onClick={() => setSelectedReworker(null)} className="mt-6 w-full bg-gray-700 hover:bg-gray-600 py-2 rounded text-white">Close (关闭)</button>
           </div>
         </div>
       )}
    </div>
  );
}