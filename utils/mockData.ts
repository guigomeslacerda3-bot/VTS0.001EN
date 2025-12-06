
import { Role, User, Vehicle, PartRequest, SCREEN_IDS } from '../types';

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    username: 'Admin', 
    role: Role.AdminGeral, 
    status: 'approved',
    permissions: [SCREEN_IDS.BOX_REPAIR, SCREEN_IDS.PARKING, SCREEN_IDS.REWORKERS, SCREEN_IDS.SUPPLY_PARTS, SCREEN_IDS.KPI, SCREEN_IDS.USERS]
  },
  { 
    id: '2', 
    username: 'rep01', 
    role: Role.Reparador, 
    status: 'approved',
    permissions: [SCREEN_IDS.BOX_REPAIR, SCREEN_IDS.PARKING, SCREEN_IDS.SUPPLY_PARTS]
  },
  { 
    id: '3', 
    username: 'log01', 
    role: Role.AnalistaLogistica, 
    status: 'approved',
    permissions: [SCREEN_IDS.SUPPLY_PARTS]
  },
];

// Initial mock state
export const MOCK_VEHICLES: Vehicle[] = [
  {
    vin: 'GWM1234567890ABCD',
    lane: 'A',
    spot: 1,
    area: 'BOX_REPAIR',
    responsible: ['Paint Shop'],
    allocatedAt: new Date().toISOString(),
    allocatedBy: 'rep01',
    waitingForParts: false,
    priority: true,
    priorityComment: 'Urgent delivery for VIP',
    status: 'active'
  }
];

export const MOCK_REQUESTS: PartRequest[] = [
  {
    id: 'req1',
    vin: 'GWM1234567890ABCD',
    partNumber: '123456788T',
    partName: 'Bumper Front',
    quantity: 1,
    reason: 'Damaged',
    requester: 'rep01',
    color: 'Sun Gold Black',
    status: 'pending',
    type: 'REPAIR_REQUEST',
    requestDate: new Date().toISOString()
  }
];
