
export enum Role {
  AdminGeral = 'Admingeral',
  Reparador = 'Reparador',
  GroupLeaderReparo = 'Group Leader Reparo',
  LiderReparo = 'Lider Reparo',
  AnalistaLogistica = 'Analista de Logistica',
  LiderLogisticaI = 'Lider de Logistica I',
  LiderLogisticaII = 'Lider de Logistica II',
  LiderLogistica = 'Lider de Logistica',
  OperadorLogistica = 'Operador de Logistica',
  CoordenadorLogistica = 'Coordenador de Logistica',
  SupervisorLogistica = 'Supervisor de Logistica',
  SupervisorAssembly = 'Supervisor Assembly',
  Viewer = 'Viewer',
}

export const SHOPS = [
  'Body Shop',
  'Paint Shop',
  'General Assembly',
  'Quality Technology',
  'R&D'
];

export const SCREEN_IDS = {
  BOX_REPAIR: 'BOX_REPAIR',
  PARKING: 'PARKING',
  REWORKERS: 'REWORKERS',
  SUPPLY_PARTS: 'SUPPLY_PARTS',
  KPI: 'KPI',
  USERS: 'USERS'
};

export const SCREEN_LABELS = {
  [SCREEN_IDS.BOX_REPAIR]: 'GWM BOX REPAIR (GWM 盒子维修)',
  [SCREEN_IDS.PARKING]: 'GWM PARKING (GWM 停车场)',
  [SCREEN_IDS.REWORKERS]: 'REWORKERS (返工人员)',
  [SCREEN_IDS.SUPPLY_PARTS]: 'SUPPLY PARTS (供应零件)',
  [SCREEN_IDS.KPI]: 'KPI (关键绩效指标)',
  [SCREEN_IDS.USERS]: 'PERMISSION MANAGEMENT (权限管理)'
};

export interface User {
  id: string;
  username: string;
  role: Role;
  status: 'pending' | 'approved' | 'rejected';
  permissions: string[]; // List of SCREEN_IDS allowed
}

export interface Vehicle {
  vin: string;
  lane: string;
  spot: number;
  area: 'BOX_REPAIR' | 'PARKING';
  responsible: string[];
  allocatedAt: string; // ISO date
  allocatedBy: string;
  waitingForParts: boolean;
  priority: boolean;
  priorityComment?: string;
  observations?: string;
  relocationReason?: string;
  status: 'active' | 'completed';
}

export interface PartRequest {
  id: string;
  vin?: string;
  line?: string;
  partNumber: string;
  partName: string;
  quantity: number;
  reason: string;
  requester: string;
  color: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  type: 'REPAIR_REQUEST' | 'LINE_REQUEST';
  requestDate: string;
  approvalDate?: string; // Timer start
  completionDate?: string; // Timer end
  rejectionReason?: string;
}

export interface BOMItem {
  partNumber: string;
  partName: string;
  line: string; // Column C
}

export interface ReworkRecord {
  id: string;
  vin: string;
  shop: string;
  durationSeconds: number;
  date: string;
  technician: string;
  status: 'completed' | 'cancelled';
}

export const COLOR_CODES: Record<string, string> = {
  '8T': 'Sun Gold Black',
  '9C': 'Hamilton White',
  'DX': 'Nebula Grey',
  'F3': 'Ayers Grey',
  'H4': 'Atlantis Blue',
  'KU': 'KU Grey'
};

export const determineColor = (partNumber: string): string => {
  if (!partNumber) return 'Colorless (无色)';
  const suffix = partNumber.slice(-2).toUpperCase();
  return COLOR_CODES[suffix] || 'Colorless (无色)';
};
