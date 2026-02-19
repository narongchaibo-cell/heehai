
import React, { useState, useMemo, useRef } from 'react';
import { InspectionRecord, MachineStatus, ApprovalStatus, UserRole, Personnel, User, PersonnelRole } from '../types';

interface HistoryListProps {
  records: InspectionRecord[];
  machines: any[];
  personnel: Personnel[];
  onEditRecord: (record: InspectionRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  user: User;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, machines, personnel, onEditRecord, onDeleteRecord, user }) => {
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const canEdit = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.ADMIN || 
           user.personnelRole === PersonnelRole.SUPERVISOR || 
           user.personnelRole === PersonnelRole.ENGINEER;
  }, [user]);

  const canDelete = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.ADMIN || 
           user.personnelRole === PersonnelRole.SUPERVISOR || 
           user.personnelRole === PersonnelRole.ENGINEER;
  }, [user]);

  const getMachineName = (id: string) => machines.find(m => m.id === id)?.name || id;

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543).toString().slice(-2);
    
    return {
      date: `${day} ${month} ${year}`,
      time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    };
  };

  const filteredRecords = useMemo(() => {
    return [...records]
      .filter(r => !r.deletedAt)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  // Calendar Logic
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startOffset = firstDayOfMonth(currentMonth);
    
    // Previous month filler
    for (let i = 0; i < startOffset; i++) days.push(null);
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) days.push(i);
    
    return days;
  }, [currentMonth]);

  const recordsByDate = useMemo(() => {
    const map: Record<string, InspectionRecord[]> = {};
    filteredRecords.forEach(r => {
      const dateKey = new Date(r.date).toDateString();
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(r);
    });
    return map;
  }, [filteredRecords]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const handleDeleteClick = (e: React.MouseEvent, recordId: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (!canDelete) return alert('🔒 ขออภัย เฉพาะหัวหน้างานหรือผู้ดูแลระบบเท่านั้นที่มีสิทธิ์ลบข้อมูล');
    if (window.confirm(`⚠️ ยืนยันการลบประวัติรหัส ${recordId}?`)) onDeleteRecord(recordId);
  };

  const handleEditClick = (e: React.MouseEvent, record: InspectionRecord) => {
    e.preventDefault();
    e.stopPropagation();
    if (canEdit) onEditRecord(record);
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => { 
    e.preventDefault();
    e.stopPropagation();
    if (!selectedRecord || !reportRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const opt = {
        margin: [15, 18, 15, 18], 
        filename: `TMC_Report_${selectedRecord.id}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 4, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      await html2pdf().from(reportRef.current).set(opt).save();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 font-prompt animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2 mb-6">
        <div>
           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">TMC Operation Console</p>
           <h3 className="text-4xl font-black text-slate-800">ประวัติการตรวจสอบ</h3>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm">
           <button 
            onClick={() => setViewMode('list')}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-[#1E1B4B] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             รายการ (List)
           </button>
           <button 
            onClick={() => setViewMode('calendar')}
            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase transition-all ${viewMode === 'calendar' ? 'bg-[#1E1B4B] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             ปฏิทิน (Calendar)
           </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          <div className="px-2 mb-4">
            <h4 className="text-lg font-bold text-slate-700">ประวัติการตรวจล่าสุด</h4>
          </div>
          {filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredRecords.map((record) => {
                const dt = formatDateTime(record.date);
                const machineShortId = record.machineId.split('-')[0];
                return (
                  <div key={record.id} onClick={() => setSelectedRecord(record)} className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#2563EB] font-black text-xl">{machineShortId}</div>
                      <div className={`px-5 py-2 rounded-full text-[12px] font-black border ${
                        record.overallStatus === MachineStatus.OPERATIONAL ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]' : 
                        record.overallStatus === MachineStatus.WARNING ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
                      }`}>
                        {record.overallStatus}
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-6 tracking-tight group-hover:text-[#2563EB] transition-colors line-clamp-2">{getMachineName(record.machineId)}</h4>
                    <div className="space-y-4 mb-20">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-600"><span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🗓️</span> {dt.date}</div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-400"><span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🕒</span> {dt.time}</div>
                    </div>
                    <div className="absolute bottom-10 right-10 flex gap-4">
                      {canEdit && <button onClick={(e) => handleEditClick(e, record)} className="w-12 h-12 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-white">✏️</button>}
                      {canDelete && <button onClick={(e) => handleDeleteClick(e, record.id)} className="w-12 h-12 rounded-2xl bg-[#E11D48] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-white">🗑️</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="text-6xl mb-6 opacity-20 grayscale">📜</div>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">ยังไม่มีข้อมูลในระบบ</p>
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h4 className="text-2xl font-black text-slate-900">{currentMonth.toLocaleString('th-TH', { month: 'long', year: 'numeric' })}</h4>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Inspection Schedule Overview</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => changeMonth(-1)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#1E1B4B] hover:text-white transition-all flex items-center justify-center font-bold text-xl shadow-sm">←</button>
              <button onClick={() => changeMonth(1)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#1E1B4B] hover:text-white transition-all flex items-center justify-center font-bold text-xl shadow-sm">→</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-4 border-b border-slate-50">{day}</div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="h-32 bg-slate-50/30 rounded-3xl opacity-20"></div>;
              
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const dateKey = date.toDateString();
              const dayRecords = recordsByDate[dateKey] || [];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div key={`day-${day}`} className={`h-40 p-4 rounded-3xl border transition-all overflow-hidden flex flex-col group ${
                  isToday ? 'border-indigo-600 bg-indigo-50/30 ring-4 ring-indigo-50' : 'border-slate-50 bg-white hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-lg font-black ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>{day}</span>
                    <div className="flex gap-1">
                      {dayRecords.slice(0, 3).map((r, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${
                          r.overallStatus === MachineStatus.OPERATIONAL ? 'bg-emerald-400' : 
                          r.overallStatus === MachineStatus.WARNING ? 'bg-amber-400' : 'bg-rose-400'
                        }`}></div>
                      ))}
                      {dayRecords.length > 3 && <span className="text-[8px] font-black text-slate-300">+{dayRecords.length - 3}</span>}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
                    {dayRecords.map(r => (
                      <div key={r.id} onClick={() => setSelectedRecord(r)} className="p-2 bg-slate-50 rounded-xl hover:bg-indigo-600 group/item cursor-pointer transition-all border border-slate-100 flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-600 group-hover/item:text-white truncate flex-1">{getMachineName(r.machineId)}</p>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                           {canEdit && <button onClick={(e) => handleEditClick(e, r)} className="w-5 h-5 rounded-lg bg-white/20 text-white flex items-center justify-center text-[8px] hover:bg-white/40 transition-colors">✏️</button>}
                           {canDelete && <button onClick={(e) => handleDeleteClick(e, r.id)} className="w-5 h-5 rounded-lg bg-white/20 text-white flex items-center justify-center text-[8px] hover:bg-rose-500 transition-colors">🗑️</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Modal (Same as existing) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#1E1B4B] p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="z-10">
                <h3 className="text-xl font-black">รายละเอียดรายงาน</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">REF ID: {selectedRecord.id}</p>
              </div>
              <div className="flex gap-4 items-center z-10">
                {canDelete && <button onClick={(e) => { setSelectedRecord(null); handleDeleteClick(e, selectedRecord.id); }} className="h-12 px-6 bg-[#E11D48] hover:bg-rose-700 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border border-rose-400 group"><span className="text-lg">🗑️</span> ลบประวัติ</button>}
                <button onClick={handleDownloadPDF} className="h-12 px-8 bg-[#5445FF] hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase transition-all shadow-xl flex items-center justify-center gap-2"><span className="text-lg">📥</span> {isDownloading ? '...' : 'PDF'}</button>
                <button onClick={() => setSelectedRecord(null)} className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center text-xl">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50 space-y-8 custom-scrollbar" ref={reportRef}>
               <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MACHINE PROFILE</p>
                    <p className="text-2xl font-black text-slate-900">{getMachineName(selectedRecord.machineId)}</p>
                    <p className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">ID: {selectedRecord.machineId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INSPECTION DATE</p>
                    <p className="text-lg font-bold text-slate-700">{formatDateTime(selectedRecord.date).date}</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-4">
                 {selectedRecord.sections.map(sec => (
                   <div key={sec.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                      <h6 className="font-black text-indigo-600 mb-6 flex items-center gap-2">🔘 {sec.title}</h6>
                      <div className="space-y-4">
                        {sec.items.map(item => {
                          const val = selectedRecord.values[item.id];
                          const statusText = val?.status || (typeof val === 'boolean' ? (val ? 'NORMAL' : 'ABNORMAL') : val || '-');
                          const statusColor = val?.status === 'NORMAL' || val === true ? 'text-emerald-500' : val?.status === 'WARNING' ? 'text-amber-500' : 'text-rose-500';
                          return (
                            <div key={item.id} className="py-4 border-b border-slate-50 last:border-0 flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-600">{item.label}</span>
                              <span className={`text-sm font-black uppercase ${statusColor} bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100`}>{statusText}</span>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
