import React, { useState } from 'react';
import { useAppContext } from '../App';
import { SHOPS, Vehicle, Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { Car, Search, Home, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Slot } from '../components/Slot';
import { supabase } from '../supabaseClient';

export default function Parking() {
  const { user, vehicles, setVehicles, refreshData } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [foundVin, setFoundVin] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'allocate' | 'deallocate' | 'priority' | null>(null);
  
  // States for Allocation
  const [vin, setVin] = useState('');
  const [selectedShops, setSelectedShops] = useState<string[]>([]);
  const [waitingParts, setWaitingParts] = useState(false);
  const [relocationReason, setRelocationReason] = useState('');
  
  // States for Priority
  const [adminComment, setAdminComment] = useState('');
  const [targetVehicle, setTargetVehicle] = useState<Vehicle | null>(null);

  const lanes = ['A', 'B', 'C', 'D', 'E', 'F'];
  const SPOTS_PER_LANE = 34;
  const SPOTS_PER_ROW = 17;

  const handleSearch = () => {
    const v = vehicles.find(v => v.vin.includes(searchTerm) || v.vin.endsWith(searchTerm));
    if (v) {
      setFoundVin(v.vin);
      setTimeout(() => setFoundVin(null), 5000);
    } else {
      alert('Vehicle not found (未找到车辆)');
    }
  };

  const handleSlotClick = (lane: string, idx: number) => {
    const slotId = `${lane}-${idx + 1}`;
    const vehicle = vehicles.find(v => v.lane === lane && v.spot === idx + 1 && v.area === 'PARKING');
    
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
      setVin('');
      setSelectedShops([]);
      setWaitingParts(false);
      setRelocationReason('');
    }
  };

  const handleShopToggle = (shop: string) => {
    setSelectedShops(prev => prev.includes(shop) ? prev.filter(s => s !== shop) : [...prev, shop]);
  };

  const handleAllocate = async () => {
    if (vin.length !== 17) return alert('Invalid VIN (17 characters required) (无效的 VIN)');
    if (selectedShops.length === 0) return alert('Select at least one shop (选择至少一家商店)');
    
    if (vehicles.find(v => v.vin === vin)) return alert('VIN already allocated (系统里已存在VIN)');

    const [lane, spot] = selectedSlot!.split('-');
    
    const newVehicle: Vehicle = {
      vin,
      lane,
      spot: parseInt(spot),
      area: 'PARKING',
      responsible: selectedShops,
      allocatedAt: new Date().toISOString(),
      allocatedBy: user?.username || '',
      waitingForParts: waitingParts,
      priority: false,
      relocationReason: relocationReason,
      status: 'active'
    };

    const { error } = await supabase.from('vehicles').insert([newVehicle]);
    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    await refreshData();
    setModalMode(null);
    
    if (waitingParts) {
      navigate('/supply-parts');
    } else {
      alert('Vehicle allocated successfully (车辆分配成功)');
    }
  };

  const handleDeallocate = async () => {
    const [lane, spot] = selectedSlot!.split('-');
    const vehicle = vehicles.find(v => v.lane === lane && v.spot === parseInt(spot) && v.area === 'PARKING');
    
    if (vehicle) {
       const { error } = await supabase.from('vehicles').delete().eq('vin', vehicle.vin);
       if (error) {
         alert('Error: ' + error.message);
         return;
       }
       await refreshData();
       setModalMode(null);
    }
  };

  const togglePriority = async () => {
    if (!selectedSlot || !targetVehicle) return;
    const isPriorityNow = targetVehicle.priority;
    
    const { error } = await supabase.from('vehicles').update({
       priority: !isPriorityNow,
       priorityComment: !isPriorityNow ? adminComment : null
    }).eq('vin', targetVehicle.vin);

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    await refreshData();
    setModalMode(null);
  };

  const exportParkingData = () => {
    const parkingVehicles = vehicles.filter(v => v.area === 'PARKING');
    const headers = ["Lane", "Spot", "VIN", "Responsible", "Waiting Parts", "Allocated At", "Allocated By", "Priority"];
    const rows = parkingVehicles.map(v => [
      v.lane, v.spot, v.vin, v.responsible.join('; '), v.waitingForParts ? 'Yes' : 'No', v.allocatedAt, v.allocatedBy, v.priority ? 'Yes' : 'No'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "GWM_Parking_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSlots = lanes.length * SPOTS_PER_LANE;
  const occupied = vehicles.filter(v => v.area === 'PARKING').length;
  const pieData = [
    { name: 'Occupied', value: occupied, color: '#3b82f6' },
    { name: 'Free', value: totalSlots - occupied, color: '#475569' }
  ];

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Car className="mr-2" /> Parking (停车场)
        </h2>
        <div className="flex gap-2">
            <button onClick={exportParkingData} className="flex items-center bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold shadow transition-colors">
               <Download className="w-4 h-4 mr-2" /> Export (Excel)
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold shadow transition-colors">
               <Home className="w-4 h-4 mr-2" /> Main Menu
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gwm-card p-4 rounded-lg mb-6 shadow-md border border-gray-700">
        <div>
           <label className="block text-sm mb-1">Search Vehicle / Deallocate (搜索车辆/取消分配)</label>
           <div className="flex space-x-2">
             <input 
               type="text" 
               className="bg-gray-800 border border-gray-600 rounded p-2 flex-grow text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
               <PieChart>
                 <Pie data={pieData} dataKey="value" innerRadius={20} outerRadius={40}>
                   {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="text-xs">
             <div>Total: {totalSlots}</div>
             <div>Occupied: {occupied}</div>
             <div>Free: {totalSlots - occupied}</div>
           </div>
        </div>
      </div>

      <div className="space-y-6 overflow-x-auto pb-4">
        {lanes.map(lane => (
          <div key={lane} className="bg-gray-800/50 p-4 rounded border border-gray-700 min-w-[2200px]">
             <h3 className="text-lg font-bold mb-2 text-gray-400">Lane {lane}</h3>
             
             <div className="flex flex-col gap-3">
                <div 
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${SPOTS_PER_ROW}, minmax(120px, 1fr))` }} 
                >
                   {Array.from({ length: SPOTS_PER_ROW }).map((_, i) => {
                       const spotNum = i + 1;
                       const slotId = `${lane}-${spotNum}`;
                       const vehicle = vehicles.find(v => v.lane === lane && v.spot === spotNum && v.area === 'PARKING');
                       const isBlinking = foundVin && vehicle ? vehicle.vin === foundVin : false;
                       return (
                         <Slot key={slotId} id={slotId} vehicle={vehicle} onClick={() => handleSlotClick(lane, i)} isBlinking={isBlinking} isAdmin={user?.role === Role.AdminGeral} />
                       );
                   })}
                </div>

                <div 
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${SPOTS_PER_ROW}, minmax(120px, 1fr))` }} 
                >
                   {Array.from({ length: SPOTS_PER_ROW }).map((_, i) => {
                       const spotNum = SPOTS_PER_ROW + i + 1; 
                       const slotId = `${lane}-${spotNum}`;
                       const vehicle = vehicles.find(v => v.lane === lane && v.spot === spotNum && v.area === 'PARKING');
                       const isBlinking = foundVin && vehicle ? vehicle.vin === foundVin : false;
                       return (
                         <Slot key={slotId} id={slotId} vehicle={vehicle} onClick={() => handleSlotClick(lane, SPOTS_PER_ROW + i)} isBlinking={isBlinking} isAdmin={user?.role === Role.AdminGeral} />
                       );
                   })}
                </div>
             </div>
          </div>
        ))}
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gwm-card p-6 rounded-lg w-full max-w-md border border-gray-500 shadow-2xl">
             <h3 className="text-xl font-bold mb-4">
               {modalMode === 'allocate' ? 'Allocate Vehicle (分配车辆)' : 
                modalMode === 'deallocate' ? 'Deallocate Vehicle (取消分配车辆)' : 'Admin Priority (管理员优先)'}
             </h3>

             {modalMode === 'allocate' && (
               <>
                 <input 
                   className="w-full bg-gray-700 p-2 rounded mb-2 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500" 
                   placeholder="VIN (17 chars)" 
                   value={vin} 
                   onChange={e => setVin(e.target.value.toUpperCase())} 
                   maxLength={17} 
                 />
                 
                 <div className="mb-2">
                   <label className="block text-sm mb-1 text-gray-300">Responsible Shop (负责商店)</label>
                   <div className="flex flex-wrap gap-2">
                     {SHOPS.map(s => (
                       <button 
                         key={s} 
                         onClick={() => handleShopToggle(s)}
                         className={`px-2 py-1 text-xs rounded border transition-colors ${selectedShops.includes(s) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
                       >
                         {s}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="flex items-center mb-4 bg-gray-800 p-2 rounded">
                    <input type="checkbox" checked={waitingParts} onChange={e => setWaitingParts(e.target.checked)} className="mr-2 w-4 h-4" />
                    <span className="text-sm">Is the vehicle waiting for parts? (车辆在等零件吗？)</span>
                 </div>

                 <label className="block text-sm mb-1 text-gray-300">Relocation Reason (if applicable) (搬迁原因)</label>
                 <textarea 
                   className="w-full bg-gray-700 p-2 rounded mb-4 text-white border border-gray-600" 
                   placeholder="Reason..."
                   value={relocationReason}
                   onChange={e => setRelocationReason(e.target.value)}
                 />

                 <button onClick={handleAllocate} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded text-white font-bold mb-2 transition-colors shadow">Confirm (确认)</button>
               </>
             )}

             {modalMode === 'deallocate' && (
               <>
                 <p className="mb-4 text-gray-300">Do you want to free this spot ({selectedSlot})? History will be saved. (您要释放此地点 ({selectedSlot}) 吗？ 历史记录将被保存。)</p>
                 <button onClick={handleDeallocate} className="w-full bg-red-600 hover:bg-red-500 py-2 rounded text-white font-bold mb-2 transition-colors shadow">Deallocate (取消分配)</button>
               </>
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

             <button onClick={() => setModalMode(null)} className="w-full text-gray-400 hover:text-white py-2">Cancel (取消)</button>
          </div>
        </div>
      )}
    </div>
  );
}