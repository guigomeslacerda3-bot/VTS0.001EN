
import React, { useState } from 'react';
import { useAppContext } from '../App';
import { PartRequest, determineColor, Role } from '../types';
import { Plus, Check, X, Home, Download, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SupplyParts() {
  const { user, requests, setRequests, refreshData } = useAppContext();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'REPAIR' | 'LINE' | 'FINALIZED'>('REPAIR');
  
  const [formVin, setFormVin] = useState('');
  const [formPartNum, setFormPartNum] = useState('');
  const [formPartName, setFormPartName] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formReason, setFormReason] = useState('');
  const [formLine, setFormLine] = useState('');
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReqId, setRejectReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const formColor = determineColor(formPartNum);

  const canRequest = true; 

  const canManageRequests = user?.role === Role.AdminGeral || 
                            user?.role === Role.SupervisorLogistica || 
                            user?.role === Role.AnalistaLogistica;

  const getVisibleTabs = () => {
    const tabs = [];
    if (user?.role === Role.AdminGeral || user?.role === Role.Reparador || user?.role === Role.GroupLeaderReparo || 
        user?.role === Role.LiderReparo || user?.role === Role.SupervisorAssembly || user?.role === Role.AnalistaLogistica ||
        user?.role === Role.SupervisorLogistica || user?.role === Role.CoordenadorLogistica) {
      tabs.push({ id: 'REPAIR', label: 'Repair Request (维修请求)' });
    }

    if (user?.role === Role.AdminGeral || user?.role === Role.LiderLogisticaI || user?.role === Role.LiderLogistica || 
        user?.role === Role.CoordenadorLogistica || user?.role === Role.SupervisorLogistica || user?.role === Role.AnalistaLogistica ||
        user?.role === Role.LiderLogisticaII) {
      tabs.push({ id: 'LINE', label: 'Line Request (生产线请求)' });
    }

    tabs.push({ id: 'FINALIZED', label: 'History (历史记录)' });

    if (tabs.length === 0) return [{ id: 'REPAIR', label: 'Repair Request (维修请求)' }, { id: 'FINALIZED', label: 'History (历史记录)' }];
    return tabs.filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
  };
  
  const visibleTabs = getVisibleTabs();

  const submitRequest = async (type: 'REPAIR_REQUEST' | 'LINE_REQUEST') => {
    if (type === 'REPAIR_REQUEST' && formVin.length !== 17) {
        alert('VIN must have 17 characters (VIN 必须有 17 位数字)');
        return;
    }
    if (!formPartNum) {
        alert('Part Number is required (零件号是必填项)');
        return;
    }

    const newReq: PartRequest = {
      id: Math.random().toString(36).substr(2, 9),
      vin: type === 'REPAIR_REQUEST' ? formVin : undefined,
      line: type === 'LINE_REQUEST' ? formLine : undefined,
      partNumber: formPartNum,
      partName: formPartName || '',
      quantity: formQty,
      reason: formReason,
      requester: user?.username || 'user',
      color: formColor,
      status: 'pending',
      type,
      requestDate: new Date().toISOString()
    };
    
    // DB Insert
    const { error } = await supabase.from('requests').insert([newReq]);
    if (error) {
       alert('Error submitting: ' + error.message);
       return;
    }

    await refreshData();
    alert('Request submitted successfully! (请求发送成功！)');
    setFormVin(''); setFormPartNum(''); setFormPartName(''); setFormLine(''); setFormQty(1); setFormReason('');
  };

  const approveRequest = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!canManageRequests) {
      alert("Permission denied. Only Analyst, Supervisor, or Admin can approve.");
      return;
    }

    const { error } = await supabase.from('requests').update({
       status: 'approved',
       approvalDate: new Date().toISOString()
    }).eq('id', id);

    if (error) alert('Error: ' + error.message);
    else await refreshData();
  };

  const openRejectModal = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!canManageRequests) {
      alert("Permission denied. Only Analyst, Supervisor, or Admin can reject.");
      return;
    }
    setRejectReqId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectReqId) return;
    
    if (rejectReason.trim() === '') {
        alert('Reason for rejection is required. (必须提供拒绝理由。)');
        return;
    }

    const { error } = await supabase.from('requests').update({
       status: 'rejected',
       rejectionReason: rejectReason,
       completionDate: new Date().toISOString()
    }).eq('id', rejectReqId);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        await refreshData();
    }
    
    setIsRejectModalOpen(false);
    setRejectReqId(null);
    setRejectReason('');
  };

  const repairReqs = requests.filter(r => r.type === 'REPAIR_REQUEST' && r.status === 'pending');
  const lineReqs = requests.filter(r => r.type === 'LINE_REQUEST' && r.status === 'pending');
  const historyReqs = requests.filter(r => ['approved', 'completed', 'rejected'].includes(r.status));

  const exportData = () => {
    const headers = ["ID", "Type", "VIN", "Line", "Part Number", "Part Name", "Color", "Qtd", "Reason", "Requester", "Status", "Request Date", "Approval Date", "Rejection Reason"];
    const rows = requests.map(r => [
      r.id, r.type, r.vin || '', r.line || '', r.partNumber, r.partName, r.color, r.quantity, r.reason, r.requester, r.status, r.requestDate, r.approvalDate || '', r.rejectionReason || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "SupplyParts_History.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-white">Supply Parts (供应零件)</h2>
        <div className="flex gap-2">
            <button onClick={exportData} className="flex items-center bg-blue-600 px-3 py-2 rounded text-xs hover:bg-blue-700 shadow font-bold text-white">
               <Download className="w-3 h-3 mr-2" /> General History (Excel) (一般历史)
            </button>
            <button onClick={() => navigate('/dashboard')} className="flex items-center bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded text-xs font-bold shadow">
               <Home className="w-3 h-3 mr-2" /> Main Menu
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-700">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id ? 'bg-gwm-card text-blue-400 border-t border-x border-gray-600' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gwm-card p-6 rounded-b-lg rounded-tr-lg border border-gray-700 min-h-[400px]">
        {(activeTab === 'REPAIR' || activeTab === 'LINE') && canRequest && (
           <div className="bg-gray-800 p-4 rounded mb-8 border border-gray-600 shadow-inner">
             <h3 className="font-bold mb-4 flex items-center text-blue-300"><Plus className="w-4 h-4 mr-2" /> New Request (新请求)</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {activeTab === 'REPAIR' && (
                  <input 
                    placeholder="VIN (17 chars)" 
                    value={formVin} 
                    onChange={e => setFormVin(e.target.value.toUpperCase())} 
                    maxLength={17} 
                    className="bg-gray-700 p-2 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none" 
                  />
                )}
                {activeTab === 'LINE' && (
                  <input 
                    placeholder="Line (线)" 
                    value={formLine} 
                    onChange={e => setFormLine(e.target.value)} 
                    className="bg-gray-700 p-2 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none" 
                  />
                )}
                
                <input 
                  placeholder="Part Number" 
                  value={formPartNum} 
                  onChange={e => setFormPartNum(e.target.value)} 
                  className="bg-gray-700 p-2 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none" 
                />

                <input 
                  placeholder="Part Name (Optional)" 
                  value={formPartName} 
                  onChange={e => setFormPartName(e.target.value)}
                  className="bg-gray-700 p-2 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none" 
                />
                
                <input 
                  placeholder="Color (颜色)" 
                  value={formColor} 
                  disabled 
                  className="bg-gray-700 p-2 rounded text-yellow-300 font-bold border border-gray-600" 
                  title="Auto-color based on Part suffix"
                />

                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={formQty} 
                  onChange={e => setFormQty(parseInt(e.target.value))} 
                  className="bg-gray-700 p-2 rounded text-white border border-gray-600 focus:border-blue-500 focus:outline-none" 
                />
             </div>
             <input 
               placeholder="Reason (原因)" 
               value={formReason} 
               onChange={e => setFormReason(e.target.value)} 
               className="w-full bg-gray-700 p-2 rounded text-white mb-4 border border-gray-600 focus:border-blue-500 focus:outline-none" 
             />
             <button onClick={() => submitRequest(activeTab === 'REPAIR' ? 'REPAIR_REQUEST' : 'LINE_REQUEST')} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded text-white font-bold w-full md:w-auto transition-colors shadow">Send Request (发送请求)</button>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-700 text-gray-100 uppercase font-medium">
               <tr>
                 <th className="p-3">Date (日期)</th>
                 <th className="p-3">Info</th>
                 <th className="p-3">Part Name</th>
                 <th className="p-3">Req.</th>
                 {activeTab === 'FINALIZED' && <th className="p-3">Status</th>}
                 <th className="p-3">Actions (行动)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {(activeTab === 'REPAIR' ? repairReqs : activeTab === 'LINE' ? lineReqs : historyReqs).map(req => (
                <tr key={req.id} className="hover:bg-gray-700/50">
                   <td className="p-3">{new Date(req.requestDate).toLocaleString()}</td>
                   <td className="p-3">
                     <div className="font-bold">{req.partNumber}</div>
                     <div className="text-xs text-gray-500">{req.vin ? `VIN: ${req.vin.slice(-6)}` : `Line: ${req.line}`}</div>
                   </td>
                   <td className="p-3">
                     <div>{req.partName}</div>
                     <div className="text-xs text-yellow-500 font-semibold">{req.color}</div>
                   </td>
                   <td className="p-3">{req.requester}</td>
                   {activeTab === 'FINALIZED' && (
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold 
                          ${req.status === 'approved' ? 'bg-blue-900 text-blue-200' : 
                            req.status === 'completed' ? 'bg-green-900 text-green-200' : 
                            req.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-700'}`}>
                          {req.status === 'rejected' ? 'REJECTED (拒绝)' : req.status.toUpperCase()}
                        </span>
                      </td>
                   )}
                   <td className="p-3">
                     {req.status === 'pending' && canManageRequests && (
                       <div className="flex space-x-2">
                         <button type="button" onClick={(e) => approveRequest(req.id, e)} className="p-2 bg-green-600 hover:bg-green-500 rounded text-white transition-colors shadow flex items-center" title="Approve">
                            <Check size={16}/> <span className="ml-1 text-xs hidden sm:inline">Approve (批准)</span>
                         </button>
                         <button type="button" onClick={(e) => openRejectModal(req.id, e)} className="p-2 bg-red-600 hover:bg-red-500 rounded text-white transition-colors shadow flex items-center" title="Reject">
                             <X size={16}/> <span className="ml-1 text-xs hidden sm:inline">Reject (拒绝)</span>
                         </button>
                       </div>
                     )}
                     
                     {req.status === 'rejected' && (
                        <div className="text-xs text-red-400 font-bold mt-1 bg-red-900/30 p-1 rounded inline-block">
                           Reason: {req.rejectionReason}
                        </div>
                     )}
                   </td>
                </tr>
              ))}
              {(activeTab === 'REPAIR' ? repairReqs : activeTab === 'LINE' ? lineReqs : historyReqs).length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No requests found in this tab. (此选项卡中未找到任何请求。)</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gwm-card p-6 rounded-lg border border-red-500 w-full max-w-md shadow-2xl">
             <div className="flex items-center text-red-400 mb-4">
                <AlertTriangle className="mr-2" />
                <h3 className="text-xl font-bold text-white">Reject Request (拒绝请求)</h3>
             </div>
             
             <p className="text-gray-300 mb-2 text-sm">Please provide a reason for rejection (required): (请提供拒绝理由（必填）:)</p>
             <textarea
               className="w-full bg-gray-700 p-3 rounded text-white border border-gray-600 mb-4 focus:ring-2 focus:ring-red-500 focus:outline-none"
               placeholder="Reason (原因)..."
               rows={3}
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
             />
             
             <div className="flex space-x-3">
               <button 
                 onClick={confirmReject} 
                 className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded text-white font-bold shadow transition-colors"
               >
                 Confirm Reject (确认)
               </button>
               <button 
                 onClick={() => { setIsRejectModalOpen(false); setRejectReqId(null); }} 
                 className="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded text-white font-bold shadow transition-colors"
               >
                 Cancel (取消)
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
