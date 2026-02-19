
import React, { useState, useEffect } from 'react';
import { InspectionRecord, Task, Machine, Personnel, MachineStatus } from '../types';

interface TrashBinProps {
  deletedRecords: InspectionRecord[];
  deletedTasks: Task[];
  deletedMachines: Machine[];
  deletedPersonnel: Personnel[];
  onRestoreRecord: (record: InspectionRecord) => void;
  onDeleteRecordPermanent: (recordId: string) => void;
  onRestoreTask: (task: Task) => void;
  onDeleteTaskPermanent: (taskId: string) => void;
  onRestoreMachine: (machine: Machine) => void;
  onDeleteMachinePermanent: (machineId: string) => void;
  onRestorePersonnel: (person: Personnel) => void;
  onDeletePersonnelPermanent: (personId: string) => void;
  machines: any[];
}

const TrashBin: React.FC<TrashBinProps> = ({ 
  deletedRecords, deletedTasks, deletedMachines, deletedPersonnel,
  onRestoreRecord, onDeleteRecordPermanent,
  onRestoreTask, onDeleteTaskPermanent,
  onRestoreMachine, onDeleteMachinePermanent,
  onRestorePersonnel, onDeletePersonnelPermanent,
  machines 
}) => {
  const [now, setNow] = useState(Date.now());
  const PURGE_LIMIT_MS = 2 * 60 * 1000; // 2 Minutes

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getMachineName = (id: string) => machines.find(m => m.id === id)?.name || id;

  const calculateRemaining = (deletedAt?: string) => {
    if (!deletedAt) return 0;
    const expireTime = new Date(deletedAt).getTime() + PURGE_LIMIT_MS;
    const remaining = expireTime - now;
    return Math.max(0, remaining);
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isEmpty = deletedRecords.length === 0 && deletedTasks.length === 0 && deletedMachines.length === 0 && deletedPersonnel.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-32 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 font-prompt animate-in fade-in duration-500">
        <div className="text-6xl mb-6">🗑️</div>
        <h3 className="text-2xl font-bold text-slate-800">ถังขยะว่างเปล่า</h3>
        <p className="text-slate-400 mt-2 italic font-medium">ข้อมูลหรือภารกิจที่ถูกลบจะย้ายมาที่นี่ก่อนถูกลบถาวรใน 2 นาที</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-prompt animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-rose-50 border-l-4 border-rose-500 p-8 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center shadow-sm">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm">⚠️</div>
        <div className="flex-1">
          <h4 className="font-black text-rose-800 text-xl uppercase tracking-tight">Security Protocol: Auto-Purge</h4>
          <p className="text-rose-600/70 text-sm font-medium leading-relaxed">
            ระบบจะทำการทำลายข้อมูลถาวรออกจากฐานข้อมูลจำลองเมื่อครบกำหนดเวลา <span className="font-black underline">2 นาที</span> 
            ข้อมูลที่กู้คืนจะกลับไปยังสถานะเดิมในทันที เฉพาะแอดมินเท่านั้นที่มีสิทธิ์จัดการในส่วนนี้
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
           <div className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200">
             Security Mode Active
           </div>
           <p className="text-[10px] font-bold text-rose-400">Items: {deletedRecords.length + deletedTasks.length + deletedMachines.length + deletedPersonnel.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Inspection Records */}
        {deletedRecords.map((record) => {
          const remaining = calculateRemaining(record.deletedAt);
          const progressPercentage = (remaining / PURGE_LIMIT_MS) * 100;
          return (
            <div key={record.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 font-black text-xl">📋</div>
                <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white">{remaining > 0 ? `ลบใน ${formatTime(remaining)}` : 'ลบ...'}</div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 leading-tight mb-2">บันทึก: {getMachineName(record.machineId)}</h4>
              <p className="text-[10px] text-slate-400 mb-6">ID: {record.id}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => onRestoreRecord(record)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">กู้คืน (Restore)</button>
                <button onClick={() => onDeleteRecordPermanent(record.id)} className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase">ลบถาวร</button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                <div className="h-full bg-indigo-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          );
        })}

        {/* Machines */}
        {deletedMachines.map((m) => {
          const remaining = calculateRemaining(m.deletedAt);
          const progressPercentage = (remaining / PURGE_LIMIT_MS) * 100;
          return (
            <div key={m.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 font-black text-xl">⚙️</div>
                <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white">{remaining > 0 ? `ลบใน ${formatTime(remaining)}` : 'ลบ...'}</div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 leading-tight mb-2">เครื่องจักร: {m.name}</h4>
              <p className="text-[10px] text-slate-400 mb-6">Model: {m.model}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => onRestoreMachine(m)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">กู้คืนเครื่องจักร</button>
                <button onClick={() => onDeleteMachinePermanent(m.id)} className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase">ลบถาวร</button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                <div className="h-full bg-emerald-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          );
        })}

        {/* Personnel */}
        {deletedPersonnel.map((p) => {
          const remaining = calculateRemaining(p.deletedAt);
          const progressPercentage = (remaining / PURGE_LIMIT_MS) * 100;
          return (
            <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600 font-black text-xl">👥</div>
                <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white">{remaining > 0 ? `ลบใน ${formatTime(remaining)}` : 'ลบ...'}</div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 leading-tight mb-2">บุคลากร: {p.name}</h4>
              <p className="text-[10px] text-slate-400 mb-6">Role: {p.role}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => onRestorePersonnel(p)} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">กู้คืนพนักงาน</button>
                <button onClick={() => onDeletePersonnelPermanent(p.id)} className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase">ลบถาวร</button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                <div className="h-full bg-indigo-400" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          );
        })}

        {/* Tasks */}
        {deletedTasks.map((task) => {
          const remaining = calculateRemaining(task.deletedAt);
          const progressPercentage = (remaining / PURGE_LIMIT_MS) * 100;
          return (
            <div key={task.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 font-black text-xl">📌</div>
                <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-900 text-white">{remaining > 0 ? `ลบใน ${formatTime(remaining)}` : 'ลบ...'}</div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 leading-tight mb-2">งาน: {task.title}</h4>
              <p className="text-[10px] text-slate-400 mb-6">ID: {task.id}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => onRestoreTask(task)} className="w-full py-4 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl">กู้คืนงาน</button>
                <button onClick={() => onDeleteTaskPermanent(task.id)} className="w-full py-4 bg-white text-rose-500 border border-rose-100 rounded-2xl font-black text-[10px] uppercase">ลบถาวร</button>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                <div className="h-full bg-amber-500" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrashBin;
