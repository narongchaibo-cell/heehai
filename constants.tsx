
import { Machine, MachineStatus, ChecklistSectionTemplate } from './types';

export const DEFAULT_CHECKLIST: ChecklistSectionTemplate[] = [
  {
    id: 'sec_1',
    title: 'การบำรุงรักษา AM',
    items: [
      { id: 'am1', label: 'ความสะอาดทั่วไป', type: 'boolean' },
      { id: 'am2', label: 'การหล่อลื่นจุดหมุน', type: 'boolean' }
    ]
  },
  {
    id: 'sec_2',
    title: 'พารามิเตอร์ระบบ',
    items: [
      { id: 'sys1', label: 'แรงดันลม (Pneumatic)', type: 'numeric', unit: 'bar' },
      { id: 'sys2', label: 'อุณหภูมิใช้งาน', type: 'numeric', unit: '°C' }
    ]
  }
];

export const INITIAL_MACHINES: Machine[] = [
  {
    id: 'T1-CC01',
    name: 'Corrugator Step 1',
    model: 'TMC-1',
    lastInspection: '2024-05-20',
    status: MachineStatus.OPERATIONAL,
    location: 'Zone LON C',
    efficiency: 92,
    checklistTemplate: DEFAULT_CHECKLIST
  },
  {
    id: 'MC-001',
    name: 'CNC Milling Machine V3',
    model: 'FANUC-21i',
    lastInspection: '2024-05-15',
    status: MachineStatus.OPERATIONAL,
    location: 'Zone A - Production',
    efficiency: 94,
    checklistTemplate: DEFAULT_CHECKLIST
  }
];
