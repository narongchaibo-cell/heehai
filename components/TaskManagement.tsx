
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, NotificationPriority, UserRole, Personnel, User, TaskAttachment } from '../types';

interface TaskManagementProps {
  tasks: Task[];
  personnel: Personnel[];
  currentUser: User;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  highlightTaskId?: string | null;
  onClearHighlight?: () => void;
}

const TaskManagement: React.FC<TaskManagementProps> = ({ 
  tasks, personnel, currentUser, onAddTask, onUpdateTask, onDeleteTask, 
  highlightTaskId, onClearHighlight 
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [selectedDetailTask, setSelectedDetailTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressFileInputRef = useRef<HTMLInputElement>(null);
  
  // Filters
  const [filterMode, setFilterMode] = useState<'ALL' | 'MINE' | 'DEPT'>('ALL');

  // Form State (Admin)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<'INDIVIDUAL' | 'DEPARTMENT'>('INDIVIDUAL');
  const [assigneeName, setAssigneeName] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [priority, setPriority] = useState<NotificationPriority>(NotificationPriority.MEDIUM);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [dueDate, setDueDate] = useState('');
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);

  // Progress State (User)
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentProgressNotes, setCurrentProgressNotes] = useState('');
  const [progressAttachments, setProgressAttachments] = useState<TaskAttachment[]>([]);

  const departments = Array.from(new Set(personnel.map(p => p.info))).filter(Boolean);

  useEffect(() => {
    if (highlightTaskId) {
      const task = tasks.find(t => t.id === highlightTaskId);
      if (task) {
        if (task.assigneeName === currentUser.name) setFilterMode('MINE');
        else if (task.targetDepartment === currentUser.department) setFilterMode('DEPT');
        else setFilterMode('ALL');
      }
    }
  }, [highlightTaskId, tasks, currentUser.name, currentUser.department]);

  useEffect(() => {
    if (highlightTaskId && highlightedRef.current) {
      const timer = setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      const clearTimer = setTimeout(() => {
        if (onClearHighlight) onClearHighlight();
      }, 10000);
      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [highlightTaskId, filterMode, onClearHighlight]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignmentType('INDIVIDUAL');
    setAssigneeName('');
    setTargetDepartment('');
    setPriority(NotificationPriority.MEDIUM);
    setStatus(TaskStatus.PENDING);
    setDueDate('');
    setAttachments([]);
    setEditingTask(null);
    setIsFormOpen(false);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssignmentType(task.targetDepartment ? 'DEPARTMENT' : 'INDIVIDUAL');
    setAssigneeName(task.assigneeName);
    setTargetDepartment(task.targetDepartment || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.dueDate || '');
    setAttachments(task.attachments || []);
    setIsFormOpen(true);
    setIsDetailModalOpen(false); 
  };

  const openDetail = (task: Task) => {
    setSelectedDetailTask(task);
    setIsDetailModalOpen(true);
  };

  const openProgressUpdate = (task: Task) => {
    setSelectedDetailTask(task);
    setCurrentProgress(task.progress || 0);
    setCurrentProgressNotes(task.progressNotes || '');
    setProgressAttachments(task.attachments || []);
    setIsProgressModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isProgress: boolean = false) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`ไฟล์ ${file.name} ใหญ่เกิน 2MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment = {
          name: file.name,
          data: event.target?.result as string,
          type: file.type
        };
        if (isProgress) {
          setProgressAttachments(prev => [...prev, newAttachment]);
        } else {
          setAttachments(prev => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });
    if (isProgress) {
      if (progressFileInputRef.current) progressFileInputRef.current.value = '';
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number, isProgress: boolean = false) => {
    if (isProgress) {
      setProgressAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
  };

  const downloadAttachment = (file: TaskAttachment) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  const handleProgressSubmit = () => {
    if (!selectedDetailTask) return;
    onUpdateTask({
      ...selectedDetailTask,
      progress: currentProgress,
      progressNotes: currentProgressNotes,
      attachments: progressAttachments,
      status: currentProgress === 100 ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS,
      completedAt: currentProgress === 100 ? new Date().toISOString() : selectedDetailTask.completedAt
    });
    setIsProgressModalOpen(false);
  };

  const handleAcceptTask = (task: Task) => {
    onUpdateTask({
      ...task,
      status: TaskStatus.IN_PROGRESS,
      progress: 0,
      assigneeName: currentUser.name,
      targetDepartment: undefined 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('กรุณาระบุหัวข้อ');
    if (assignmentType === 'INDIVIDUAL' && !assigneeName) return alert('กรุณาระบุผู้รับมอบหมาย');
    if (assignmentType === 'DEPARTMENT' && !targetDepartment) return alert('กรุณาระบุแผนกเป้าหมาย');

    const taskData = {
      title,
      description,
      assigneeName: assignmentType === 'INDIVIDUAL' ? assigneeName : `ทีม${targetDepartment}`,
      targetDepartment: assignmentType === 'DEPARTMENT' ? targetDepartment : undefined,
      priority,
      status,
      dueDate,
      attachments,
      completedAt: status === TaskStatus.COMPLETED ? new Date().toISOString() : (editingTask?.completedAt || undefined)
    };

    if (editingTask) {
      onUpdateTask({ ...editingTask, ...taskData });
    } else {
      onAddTask(taskData);
    }
    resetForm();
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    const deadline = new Date(task.dueDate).getTime();
    if (task.status === TaskStatus.COMPLETED) {
      if (!task.completedAt) return false;
      return new Date(task.completedAt).getTime() > deadline;
    }
    return Date.now() > deadline;
  };

  const displayTasks = tasks.filter(task => {
    if (highlightTaskId === task.id) return true;
    if (isAdmin) return true; 
    const isAssignedToMe = task.assigneeName === currentUser.name;
    const isAssignedToMyDept = task.targetDepartment === currentUser.department;
    if (filterMode === 'MINE') return isAssignedToMe;
    if (filterMode === 'DEPT') return isAssignedToMyDept && task.status === TaskStatus.PENDING;
    return isAssignedToMe || (isAssignedToMyDept && task.status === TaskStatus.PENDING);
  });

  return (
    <div className="space-y-8 font-prompt animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">ระบบมอบหมายงาน (Smart Task Pool)</h2>
          <p className="text-slate-400 text-sm">จัดการภารกิจและติดตามสถานะการดำเนินงานแบบ Real-time</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isAdmin && (
            <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
              <button onClick={() => setFilterMode('ALL')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterMode === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>ทั้งหมด</button>
              <button onClick={() => setFilterMode('MINE')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterMode === 'MINE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>ของฉัน</button>
              <button onClick={() => setFilterMode('DEPT')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterMode === 'DEPT' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400'}`}>แผนกของฉัน</button>
            </div>
          )}
          {isAdmin && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <span>＋</span> มอบหมายงานใหม่
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayTasks.map((task) => {
          const canAccept = task.status === TaskStatus.PENDING && 
            (task.targetDepartment === currentUser.department || task.assigneeName === currentUser.name) && 
            !isAdmin;
          
          const isMyAcceptedTask = task.assigneeName === currentUser.name && task.status !== TaskStatus.PENDING;
          const isHighlighted = highlightTaskId === task.id;
          const delayed = isOverdue(task);

          return (
            <div 
              key={task.id} 
              ref={isHighlighted ? highlightedRef : null}
              className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all flex flex-col h-full relative group cursor-pointer ${
                isHighlighted ? 'border-amber-500 ring-8 ring-amber-500/10 scale-[1.03] z-10 shadow-2xl' :
                delayed && task.status !== TaskStatus.COMPLETED ? 'border-rose-300 ring-4 ring-rose-50' : 
                isMyAcceptedTask ? 'border-indigo-600 shadow-xl ring-4 ring-indigo-50' : 
                canAccept ? 'border-amber-400 shadow-lg' : 'border-slate-100'
              }`}
              onClick={() => openDetail(task)}
            >
              {task.targetDepartment && (
                <div className="absolute -top-3 left-8 px-4 py-1 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg">
                  Dept: {task.targetDepartment}
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6 pt-2">
                <div className="flex flex-col gap-1">
                  <div className={`text-[10px] font-black uppercase tracking-widest ${task.priority === 'HIGH' ? 'text-rose-500' : 'text-indigo-500'}`}>
                    ● {task.priority} Priority
                  </div>
                  {delayed && (
                    <div className="text-[9px] font-black text-rose-600 animate-pulse flex items-center gap-1">
                      ⚠️ {task.status === TaskStatus.COMPLETED ? 'ส่งล่าช้า' : 'ล่าช้ากว่ากำหนด'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {isHighlighted && <span className="bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded font-black animate-bounce uppercase shadow-md">New Task</span>}
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold border ${
                      task.status === TaskStatus.COMPLETED 
                        ? (delayed ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')
                        : (task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200')
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-8">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</h3>
                  {task.attachments && task.attachments.length > 0 && <span className="text-sm">📎</span>}
                </div>
                
                {task.status !== TaskStatus.PENDING && (
                  <div className="py-3">
                     <div className="flex justify-between mb-1.5">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ความคืบหน้า</span>
                       <span className="text-[10px] font-black text-indigo-600">{task.progress || 0}%</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                        className={`h-full rounded-full transition-all duration-700 ${task.status === TaskStatus.COMPLETED ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${task.progress || 0}%` }}
                       ></div>
                     </div>
                  </div>
                )}

                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{task.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ผู้รับผิดชอบ</span>
                  <span className={`text-xs font-bold px-3 py-1 rounded-lg ${isMyAcceptedTask ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {task.targetDepartment ? `📦 ทีม${task.targetDepartment}` : `@ ${task.assigneeName}`}
                  </span>
                </div>
                
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {canAccept ? (
                    <button 
                      onClick={() => handleAcceptTask(task)}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs shadow-xl transition-all active:scale-95"
                    >
                      🤝 รับงาน (Accept Task)
                    </button>
                  ) : isAdmin || isMyAcceptedTask ? (
                    <>
                      {task.status === TaskStatus.IN_PROGRESS && (
                        <button 
                          onClick={() => openProgressUpdate(task)}
                          className="flex-[2] py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          📈 อัปเดตการดำเนินงาน
                        </button>
                      )}
                      {task.status === TaskStatus.COMPLETED && isAdmin && (
                         <div className="flex-1 text-center py-2 px-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase">
                           เรียบร้อย ✓
                         </div>
                      )}
                      {isAdmin && (
                        <button onClick={() => openEdit(task)} className="p-3 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl font-bold text-xs transition-all">
                          ✏️
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => onDeleteTask(task.id)} className="px-3 py-3 bg-slate-50 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all">🗑️</button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => openDetail(task)} className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs">🔍 รายละเอียด</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Update Modal */}
      {isProgressModalOpen && selectedDetailTask && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[120] p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="p-10 bg-indigo-600 text-white shrink-0">
                 <h3 className="text-2xl font-black">📈 รายงานความคืบหน้า</h3>
                 <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1">Task: {selectedDetailTask.title}</p>
              </div>
              <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เปอร์เซ็นต์งาน</label>
                       <span className="text-3xl font-black text-indigo-600">{currentProgress}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5" 
                      value={currentProgress} 
                      onChange={(e) => setCurrentProgress(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">บันทึกการดำเนินงาน</label>
                    <textarea 
                      value={currentProgressNotes}
                      onChange={(e) => setCurrentProgressNotes(e.target.value)}
                      placeholder="ระบุสิ่งที่ทำไปแล้ว ปัญหา หรือหมายเหตุ..."
                      className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-300 transition-all font-medium text-sm min-h-[100px]"
                    />
                 </div>

                 {/* เพิ่มส่วนแนบไฟล์สำหรับ User */}
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">แนบไฟล์หลักฐาน (Documents/Photos)</label>
                      <button 
                        type="button" 
                        onClick={() => progressFileInputRef.current?.click()}
                        className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors"
                      >
                        📎 เพิ่มไฟล์
                      </button>
                      <input type="file" ref={progressFileInputRef} onChange={(e) => handleFileChange(e, true)} className="hidden" multiple />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                       {progressAttachments.map((file, i) => (
                         <div key={i} className="group relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <img src={file.data} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="text-xl">📄</span>
                                <p className="text-[6px] font-black text-slate-400 text-center truncate w-full px-1">{file.name}</p>
                              </div>
                            )}
                            <button 
                              onClick={() => removeAttachment(i, true)}
                              className="absolute top-0 right-0 p-1 bg-rose-500 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-[8px]">✕</span>
                            </button>
                         </div>
                       ))}
                       {progressAttachments.length === 0 && (
                         <p className="text-[10px] text-slate-300 italic">ยังไม่มีการแนบไฟล์หลักฐาน</p>
                       )}
                    </div>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <button onClick={() => setIsProgressModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase">ยกเลิก</button>
                    <button 
                      onClick={handleProgressSubmit} 
                      className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                      💾 บันทึกความคืบหน้า
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedDetailTask && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className={`p-10 text-white ${selectedDetailTask.priority === 'HIGH' ? 'bg-rose-600' : 'bg-[#1E1B4B]'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="px-4 py-1.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">ID: {selectedDetailTask.id}</span>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-2">{selectedDetailTask.title}</h3>
              <div className="flex gap-4">
                <span className="px-4 py-1 rounded-full text-[10px] font-black border border-white/30">{selectedDetailTask.status}</span>
                {selectedDetailTask.progress !== undefined && (
                  <span className="px-4 py-1 rounded-full text-[10px] font-black bg-white text-indigo-600 shadow-sm">คืบหน้า {selectedDetailTask.progress}%</span>
                )}
              </div>
            </div>
            
            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายละเอียดงาน</h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedDetailTask.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p>
              </div>

              {selectedDetailTask.progressNotes && (
                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">บันทึกการดำเนินงานล่าสุด</h4>
                  <p className="text-xs font-medium text-slate-700 italic">"{selectedDetailTask.progressNotes}"</p>
                </div>
              )}

              {/* แสดงรายการไฟล์แนบในหน้ารายละเอียด */}
              {selectedDetailTask.attachments && selectedDetailTask.attachments.length > 0 && (
                <div className="space-y-3">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ไฟล์แนบ / หลักฐาน</h4>
                   <div className="grid grid-cols-2 gap-3">
                      {selectedDetailTask.attachments.map((file, i) => (
                        <button 
                          key={i} 
                          onClick={() => downloadAttachment(file)}
                          className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all text-left group"
                        >
                          <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                            {file.type.startsWith('image/') ? '🖼️' : '📄'}
                          </span>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-slate-700 truncate">{file.name}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase">{file.type.split('/')[1] || 'FILE'}</p>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t flex justify-end gap-4">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase">ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Admin Only) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 flex flex-col">
            <div className="bg-[#0F172A] p-10 text-white shrink-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-2xl font-black">{editingTask ? 'แก้ไขงานมอบหมาย' : 'มอบหมายงานใหม่'}</h3>
                <button onClick={resetForm} className="text-slate-400 hover:text-white transition-colors text-2xl">✕</button>
              </div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Factory Task Distribution</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                <button type="button" onClick={() => setAssignmentType('INDIVIDUAL')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${assignmentType === 'INDIVIDUAL' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>👤 รายบุคคล</button>
                <button type="button" onClick={() => setAssignmentType('DEPARTMENT')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${assignmentType === 'DEPARTMENT' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400'}`}>📦 รายแผนก</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">หัวข้อ</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white outline-none font-bold text-slate-700 transition-all" placeholder="ระบุหัวข้องาน..." />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">{assignmentType === 'INDIVIDUAL' ? 'เลือกพนักงาน' : 'เลือกแผนก'}</label>
                  <select value={assignmentType === 'INDIVIDUAL' ? assigneeName : targetDepartment} onChange={e => assignmentType === 'INDIVIDUAL' ? setAssigneeName(e.target.value) : setTargetDepartment(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none font-bold text-slate-700">
                    <option value="">-- เลือก --</option>
                    {assignmentType === 'INDIVIDUAL' ? personnel.map(p => <option key={p.id} value={p.name}>{p.name} ({p.info})</option>) : departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ระดับความสำคัญ</label>
                    <select value={priority} onChange={e => setPriority(e.target.value as NotificationPriority)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-bold outline-none">
                      {Object.values(NotificationPriority).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">กำหนดส่ง</label>
                    <input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-bold outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">รายละเอียด</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white outline-none text-sm resize-none" placeholder="รายละเอียดเพิ่มเติม..."></textarea>
                </div>

                {/* ส่วนแนบไฟล์ (สำหรับ Admin) */}
                <div className="space-y-2">
                   <div className="flex justify-between items-center">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ไฟล์แนบหลักฐาน</label>
                     <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black text-indigo-600 hover:underline">📎 เพิ่มไฟล์</button>
                   </div>
                   <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} className="hidden" multiple />
                   <div className="flex flex-wrap gap-2">
                      {attachments.map((file, i) => (
                        <div key={i} className="group relative w-12 h-12 rounded-lg border bg-slate-50 flex items-center justify-center overflow-hidden">
                           <span className="text-lg">{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                           <button onClick={() => removeAttachment(i, false)} className="absolute top-0 right-0 bg-rose-500 text-white opacity-0 group-hover:opacity-100 rounded-bl-lg transition-opacity p-0.5"><span className="text-[6px]">✕</span></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button type="button" onClick={resetForm} className="flex-1 py-5 rounded-2xl border border-slate-200 text-slate-400 font-black text-xs uppercase">ยกเลิก</button>
                <button type="submit" className="flex-[2] py-5 bg-[#5445FF] text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-[#4335E6] transition-all">บันทึกงานมอบหมาย</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
