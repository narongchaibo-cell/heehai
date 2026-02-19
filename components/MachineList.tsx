
import React, { useState } from 'react';
import { Machine, MachineStatus, UserRole, User, PersonnelRole } from '../types';

interface MachineListProps {
  machines: Machine[];
  onEdit: (machine: Machine) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
  onDuplicate: (machine: Machine) => void;
  currentUser: User;
}

const MachineList: React.FC<MachineListProps> = ({ machines, onEdit, onDelete, onAddNew, onDuplicate, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = currentUser.role === UserRole.ADMIN;
  // พนักงานตำแหน่ง Supervisor หรือ Engineer สามารถแก้ไขข้อมูลเครื่องจักรได้
  const canEdit = isAdmin || currentUser.personnelRole === PersonnelRole.SUPERVISOR || currentUser.personnelRole === PersonnelRole.ENGINEER;

  const filteredMachines = machines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case MachineStatus.WARNING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case MachineStatus.CRITICAL: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const confirmDelete = (id: string) => {
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 font-prompt animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full md:max-w-md relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อหรือรหัสเครื่องจักร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none px-4 py-3 rounded-2xl border border-slate-200 bg-white font-medium text-sm outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <option value="ALL">สถานะทั้งหมด</option>
            {Object.values(MachineStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {isAdmin && (
            <button 
              onClick={onAddNew}
              className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <span>＋</span> <span className="hidden sm:inline">เพิ่มเครื่องจักร</span>
            </button>
          )}
        </div>
      </div>

      {filteredMachines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => (
            <div 
              key={machine.id}
              className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden transition-all group flex flex-col h-full ${
                deletingId === machine.id ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-100 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              <div className={`p-6 flex-1 ${deletingId === machine.id ? 'bg-rose-50/50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${deletingId === machine.id ? 'bg-rose-100 text-rose-600' : 'bg-slate-50'}`}>
                    <span className="text-[24px]">{deletingId === machine.id ? '⚠️' : '⚙️'}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(machine.status)}`}>
                    {machine.status}
                  </span>
                </div>

                <div className="space-y-1 mb-6">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{machine.id}</span>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors leading-tight">{machine.name}</h3>
                  <p className="text-sm text-slate-500">{machine.model} • {machine.location}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">ตรวจล่าสุด:</span>
                    <span className="font-bold text-slate-700">{machine.lastInspection}</span>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Health Score</span>
                      <span className={`text-sm font-bold ${machine.efficiency > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {machine.efficiency}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${machine.efficiency > 80 ? 'bg-emerald-500' : machine.efficiency > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${machine.efficiency}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 min-h-[72px] items-center">
                {deletingId === machine.id ? (
                  <div className="flex w-full gap-2 animate-in slide-in-from-bottom-1">
                    <button 
                      onClick={() => confirmDelete(machine.id)}
                      className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md shadow-rose-200"
                    >
                      ย้ายไปถังขยะ
                    </button>
                    <button 
                      onClick={() => setDeletingId(null)}
                      className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      ยกเลิก
                    </button>
                  </div>
                ) : (
                  <>
                    {canEdit ? (
                      <>
                        <button 
                          onClick={() => onEdit(machine)}
                          className="flex-[2] py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center gap-1.5"
                        >
                          ✏️ แก้ไขข้อมูล
                        </button>
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => onDuplicate(machine)}
                              className="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center"
                              title="คัดลอกเครื่องจักร"
                            >
                              📋
                            </button>
                            <button 
                              onClick={() => setDeletingId(machine.id)}
                              className="w-10 h-10 rounded-xl border border-rose-100 bg-white text-rose-500 font-bold text-xs hover:bg-rose-600 hover:text-white transition-all transform active:scale-90"
                              title="ลบเครื่องจักร"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full text-center">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">โหมดการอ่านข้อมูล (Read-Only)</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="text-4xl mb-3">🔎</div>
          <p className="text-slate-500">ไม่พบเครื่องจักรที่ตรงตามเงื่อนไข</p>
        </div>
      )}
    </div>
  );
};

export default MachineList;
