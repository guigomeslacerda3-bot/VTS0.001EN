import React, { useState } from 'react';
import { useAppContext } from '../App';
import { SHOPS, Vehicle, Role } from '../types';
import { Slot } from '../components/Slot';
import { Search, Wrench, Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart as RePie, Pie, Cell, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';

export default function BoxRepair() {
  const { user, vehicles, setVehicles, refreshData } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [foundVin, setFoundVin] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'allocate' | 'deallocate' | 'priority' | null>(null);
  const [targetVehicle, setTargetVehicle] = useState<Vehicle | null>(null);
  
  // Form States
  const [vinInput, setVinInput] = useState('');
  const [responsible, setResponsible] = useState<string>('Body Shop');
  const [observations, setObservations] = useState('');
  const [adminComment, setAdminComment] = useState('');

  const lanes = [
    { id: 'A', count: 10 },
    { id: 'B', count: 10 },
    { id: 'C', count: 8 },
    { id: 'D', count: 6 },
    { id: 'Spot Repair', count: 7 },
  ];

  const handleSearch = () => {
    const v = vehicles.find(v => v.vin.includes(searchTerm) || v.vin.endsWith(searchTerm));
    if (v) {
      setFoundVin(v.vin);
      setTimeout(() => setFoundVin(null), 5000);
    } else {
      alert('Vehicle not found (未找到车辆)');
    }
  };

  const handleSlotClick = (laneId: string, slotNum: number) => {
    const slotId = `${laneId}-${slotNum}`;
    const vehicle = vehicles.find(v => v.lane === laneId && v.spot === slotNum && v.area === 'BOX_REPAIR');

    setSelectedSlot(slotId);
    setTargetVehicle(vehicle || null);

    if (vehicle) {
      if (user?.role === Role.AdminGeral) {
        setAdminComment(vehicle.priorityComment || '');
        setModalMode('priority');
      } else {
        setModalMode('deallocate');
      }
    } else {
       if (user?.role === Role.Viewer) return;
       setModalMode('allocate');
       setVinInput('');
       setResponsible('Body Shop');
       setObservations('');
    }
  };

  const allocateVehicle = async () => {
    if (vinInput.length !== 17) {
      alert('VIN must have 17 characters (VIN 必须有 17 位数字)');
      return;
    }
    // Check duplicates in memory
    if (vehicles.find(v => v.vin === vinInput)) {
      alert('Error: VIN already allocated (错误：VIN 已分配)');
      return;
    }

    const [lane, numStr] = selectedSlot!.split('-');
    const newVehicle: Vehicle = {
      vin: vinInput,
      lane,
      spot: parseInt(numStr),
      area: 'BOX_REPAIR',
      responsible: [responsible],
      allocatedAt: new Date().toISOString(),
      allocatedBy: user?.username || 'Unknown',
      waitingForParts: false,
      priority: false,
      observations,
      status: 'active'
    };

    // DB Insert
    const { error } = await supabase.from('vehicles').insert([newVehicle]);
    if (error) {
      alert('Error saving to database: ' + error.message);
      return;
    }

    await refreshData();
    setModalMode(null);
    alert('Vehicle allocated successfully (车辆分配成功)');
  };

  const deallocateVehicle = async () => {
    const [lane, numStr] = selectedSlot!.split('-');
    const vehicle = vehicles.find(v => v.lane === lane && v.spot === parseInt(numStr) && v.area === 'BOX_REPAIR');
    
    if (vehicle) {
        // DB Delete
        const { error } = await supabase.from('vehicles').delete().eq('vin', vehicle.vin);
        if (error) {
           alert('Error deallocating: ' + error.message);
           return;
        }
        await refreshData();
        setModalMode(null);
    }
  };

  const togglePriority = async () => {
    if (!selectedSlot || !targetVehicle) return;
    const isPriorityNow = targetVehicle.priority;
    
    // DB Update
    const { error } = await supabase.from('vehicles').update({
       priority: !isPriorityNow,
       priorityComment: !isPriorityNow ? adminComment : null
    }).eq('vin', targetVehicle.vin);

    if (error) {
      alert('Error updating priority: ' + error.message);
      return;
    }

    await refreshData();
    setModalMode(null);
  };

  const exportBoxData = () => {
    const boxVehicles = vehicles.filter(v => v.area === 'BOX_REPAIR');
    const headers = ["Lane", "Spot", "VIN", "Responsible", "Priority", "Allocated At", "Allocated By"];
    const rows = boxVehicles.map(v => [
      v.lane, v.spot, v.vin, v.responsible.join('; '), v.priority ? 'Yes' : 'No', v.allocatedAt, v.allocatedBy
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "GWM_BoxRepair_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const totalSlots = lanes.reduce((acc, l) => acc + l.count, 0);
  const occupied = vehicles.filter(v => v.area === 'BOX_REPAIR').length;
  const pieData = [
    { name: 'Occupied', value: occupied, color: '#3b82f6' },
    { name: 'Free', value: totalSlots - occupied, color: '#475569' }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Wrench className="mr-2" /> Box Repair (盒子维修)
        </h2>
        <div className="flex gap-2">
            <button onClick={exportBoxData} className="flex items-center bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold shadow transition-colors">
               <Download className="w-4 h-4 mr-2" /> Export (Excel)
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold shadow transition-colors">
               <Home className="w-4 h-4 mr-2" /> Main Menu
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gwm-card p-4 rounded-lg">
        <div>
           <label className="block text-sm mb-1">Search Vehicle / Deallocate (搜索车辆/取消分配)</label>
           <div className="flex space-x-2">
             <input 
               type="text" 
               className="bg-gray-800 border border-gray-600 rounded p-2 flex-grow text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Full VIN or last 6 digits"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
             <button onClick={handleSearch} className="bg-blue-600 px-4 rounded text-white hover:bg-blue-500"><Search /></button>
           </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="h-24 w-24">
             <ResponsiveContainer width="100%" height="100%">
               <RePie data={pieData} dataKey="value" innerRadius={20} outerRadius={40}>
                 {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
               </RePie>
             </ResponsiveContainer>
           </div>
           <div className="text-xs">
             <div>Total: {totalSlots}</div>
             <div>Occupied: {occupied}</div>
             <div>Free: {totalSlots - occupied}</div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {lanes.map(lane => (
          <div key={lane.id} className="bg-gray-800/50 p-3 rounded border border-gray-700">
            <h3 className="text-lg font-bold mb-2 text-gray-400">Lane {lane.id}</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: lane.count }).map((_, idx) => {
                const slotNum = idx + 1;
                const slotId = `${lane.id}-${slotNum}`;
                const vehicle = vehicles.find(v => v.lane === lane.id && v.spot === slotNum && v.area === 'BOX_REPAIR');
                const isBlinking = foundVin && vehicle ? vehicle.vin === foundVin : false;
                
                return (
                  <Slot 
                    key={slotId} 
                    id={slotId} 
                    vehicle={vehicle} 
                    onClick={() => handleSlotClick(lane.id, slotNum)} 
                    isBlinking={isBlinking || false}
                    isAdmin={user?.role === Role.AdminGeral}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gwm-card p-6 rounded-lg max-w-md w-full border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === 'allocate' ? 'Allocate Vehicle (分配车辆)' : 
               modalMode === 'deallocate' ? 'Deallocate Vehicle (取消分配车辆)' : 'Admin Priority (管理员优先)'}
            </h3>

            {modalMode === 'allocate' && (
              <div className="space-y-3">
                <input 
                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white focus:ring-2 focus:ring-blue-500" 
                  placeholder="VIN (17 chars)" 
                  value={vinInput}
                  onChange={e => setVinInput(e.target.value.toUpperCase())}
                  maxLength={17}
                />
                <select 
                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                  value={responsible}
                  onChange={e => setResponsible(e.target.value)}
                >
                  {SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <textarea 
                  className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                  placeholder="Observations (观察结果)"
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                />
                <button onClick={allocateVehicle} className="w-full bg-blue-600 py-2 rounded text-white font-bold hover:bg-blue-500">Confirm (确认)</button>
              </div>
            )}

            {modalMode === 'deallocate' && (
              <div className="space-y-3">
                <p>Are you sure you want to deallocate the vehicle from {selectedSlot}? (您确定要从 {selectedSlot} 取消分配车辆吗？)</p>
                <button onClick={deallocateVehicle} className="w-full bg-red-600 py-2 rounded text-white font-bold hover:bg-red-500">Deallocate (取消分配)</button>
              </div>
            )}

            {modalMode === 'priority' && targetVehicle && (
              <div className="space-y-3">
                <p>Current Status: {targetVehicle.priority ? 'PRIORITY (优先)' : 'NORMAL (普通的)'}</p>
                {!targetVehicle.priority && (
                  <textarea 
                     className="w-full bg-gray-700 p-2 rounded border border-gray-600 text-white"
                     placeholder="Admin Comment (管理员评论)"
                     value={adminComment}
                     onChange={e => setAdminComment(e.target.value)}
                  />
                )}
                <div className="flex space-x-2">
                  <button 
                    onClick={togglePriority} 
                    className={`flex-1 py-2 rounded text-white ${targetVehicle.priority ? 'bg-gray-600 hover:bg-gray-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}
                  >
                    {targetVehicle.priority ? 'Remove Priority (删除优先级)' : 'Set Priority (设置优先级)'}
                  </button>
                  <button onClick={() => setModalMode('deallocate')} className="flex-1 bg-red-600 py-2 rounded text-white hover:bg-red-500">Deallocate (取消分配)</button>
                </div>
              </div>
            )}
            
            <button onClick={() => setModalMode(null)} className="mt-4 w-full text-gray-400 hover:text-white">Cancel (取消)</button>
          </div>
        </div>
      )}
    </div>
  );
}