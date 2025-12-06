import React from 'react';
import { Vehicle } from '../types';

interface SlotProps {
  id: string; // e.g. "A-1"
  vehicle?: Vehicle;
  onClick: () => void;
  isBlinking: boolean;
  isAdmin: boolean;
}

export const Slot: React.FC<SlotProps> = ({ id, vehicle, onClick, isBlinking, isAdmin }) => {
  const hasPriority = vehicle?.priority === true;
  
  // Custom styled Tooltip content
  const tooltipContent = vehicle ? (
    <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-gray-500 rounded shadow-2xl text-xs text-left hidden group-hover:block pointer-events-none">
      <div className="font-bold text-white mb-1 border-b border-gray-700 pb-1">Details (细节)</div>
      <p><span className="text-gray-400">VIN:</span> {vehicle.vin}</p>
      <p><span className="text-gray-400">Resp:</span> {vehicle.responsible.join(', ')}</p>
      <p><span className="text-gray-400">Allocated:</span> {new Date(vehicle.allocatedAt).toLocaleString()}</p>
      <p><span className="text-gray-400">By:</span> {vehicle.allocatedBy}</p>
      {vehicle.observations && <p className="mt-1 text-yellow-100 italic">Obs: {vehicle.observations}</p>}
      {vehicle.relocationReason && <p className="mt-1 text-red-300">Relocation: {vehicle.relocationReason}</p>}
      {vehicle.priorityComment && <p className="mt-1 text-yellow-400 font-bold">Admin: {vehicle.priorityComment}</p>}
      <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-gray-500"></div>
    </div>
  ) : null;

  return (
    <div 
      onClick={onClick}
      className={`
        relative group w-full h-full min-h-[5rem] rounded-md border text-xs p-1 flex flex-col justify-between cursor-pointer transition-all duration-200
        ${(isBlinking || hasPriority) ? 'animate-blink-red border-red-500 bg-red-900/40 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}
        ${vehicle 
          ? 'bg-blue-600 border-blue-400 hover:bg-blue-500 text-white shadow-sm' 
          : 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-400'}
      `}
    >
      {tooltipContent}
      
      <div className="font-bold flex justify-between items-start leading-none">
        <span>{id}</span>
        {vehicle && vehicle.priority && <span className="text-yellow-300 text-lg font-bold drop-shadow-md">★</span>}
      </div>
      
      {vehicle ? (
        <div className="text-center flex flex-col items-center justify-center flex-grow overflow-hidden">
          <div className="font-mono font-bold text-[10px] sm:text-xs tracking-tight truncate w-full" title={vehicle.vin}>
            {vehicle.vin.length > 8 ? '...' + vehicle.vin.slice(-6) : vehicle.vin}
          </div>
          <div className="truncate text-[9px] w-full text-blue-100">{vehicle.responsible[0]}</div>
          <div className="text-[8px] opacity-75 leading-tight">
            {new Date(vehicle.allocatedAt).toLocaleDateString()}
            <br/>
            {new Date(vehicle.allocatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full opacity-20">
          <span className="text-xl">+</span>
        </div>
      )}

      {/* Visual Indicator for Waiting Parts */}
      {vehicle?.waitingForParts && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
      )}
    </div>
  );
};