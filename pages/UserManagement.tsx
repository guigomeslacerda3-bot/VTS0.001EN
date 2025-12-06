import React from 'react';
import { useAppContext } from '../App';
import { Role, SCREEN_IDS, SCREEN_LABELS } from '../types';
import { supabase } from '../supabaseClient';

export default function UserManagement() {
  const { users, refreshData } = useAppContext();

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else refreshData();
  };

  const handleRoleChange = async (id: string, newRole: Role) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
    if (error) alert('Error: ' + error.message);
    else refreshData();
  };

  const togglePermission = async (userId: string, screenId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentPermissions = user.permissions || [];
    const newPermissions = currentPermissions.includes(screenId)
      ? currentPermissions.filter(p => p !== screenId)
      : [...currentPermissions, screenId];
    
    // Update DB (Supabase handles array columns as text[])
    const { error } = await supabase
      .from('users')
      .update({ permissions: newPermissions })
      .eq('id', userId);

    if (error) alert('Error: ' + error.message);
    else refreshData();
  };

  const configurableScreens = [
    SCREEN_IDS.BOX_REPAIR,
    SCREEN_IDS.PARKING,
    SCREEN_IDS.REWORKERS,
    SCREEN_IDS.SUPPLY_PARTS,
    SCREEN_IDS.KPI,
    SCREEN_IDS.USERS
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">User Management (用户管理)</h2>
      
      <div className="bg-gwm-card rounded-lg overflow-hidden border border-gray-700 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-gray-800 text-gray-400 uppercase">
            <tr>
              <th className="p-4">Username (用户名)</th>
              <th className="p-4">Role (角色)</th>
              <th className="p-4">Status (地位)</th>
              <th className="p-4">Enabled Screens (启用的屏幕)</th>
              <th className="p-4">Action (行动)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-800/50">
                <td className="p-4 font-bold">{u.username}</td>
                <td className="p-4">
                  {u.role === Role.AdminGeral ? (
                    <span className="text-blue-400 font-bold">{u.role}</span>
                  ) : (
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                      className="bg-gray-700 border border-gray-600 rounded p-1 text-white"
                    >
                      {Object.values(Role)
                        .filter(r => r !== Role.Viewer)
                        .map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${u.status === 'approved' ? 'bg-green-900 text-green-200' : 'bg-yellow-900 text-yellow-200'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-4">
                   {u.role === Role.AdminGeral ? (
                      <span className="text-gray-500 italic">Full Access (Admin)</span>
                   ) : (
                      <div className="flex flex-wrap gap-2">
                        {configurableScreens.map(screenId => (
                          <label key={screenId} className="flex items-center space-x-1 bg-gray-900 px-2 py-1 rounded border border-gray-700 cursor-pointer hover:border-blue-500">
                            <input 
                              type="checkbox"
                              checked={(u.permissions || []).includes(screenId)}
                              onChange={() => togglePermission(u.id, screenId)}
                              className="rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-xs">{SCREEN_LABELS[screenId]}</span>
                          </label>
                        ))}
                      </div>
                   )}
                </td>
                <td className="p-4">
                  {u.status === 'pending' && (
                    <button onClick={() => handleApprove(u.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">
                      Approve (批准)
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}