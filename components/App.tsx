
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MachineList from './components/MachineList';
import TaskManagement from './components/TaskManagement';
import InspectionForm from './components/InspectionForm';
import AIChatAssistant from './components/AIChatAssistant';
import MachineForm from './components/MachineForm';
import HistoryList from './components/HistoryList';
import PersonnelManagement from './components/PersonnelManagement';
import TrashBin from './components/TrashBin';
import InternalChat from './components/InternalChat';
import { TMCLogo } from './components/Branding';
import { INITIAL_MACHINES } from './constants';
import { 
  Machine, MachineStatus, InspectionRecord, User, UserRole, 
  ApprovalStatus, Personnel, PersonnelRole, Notification, 
  NotificationPriority, Task, TaskStatus, ChatMessage, TaskAttachment 
} from './types';

const translations = {
  TH: {
    hubTitle: "Enterprise Resource Hub",
    hubSubtitle: "ความปลอดภัยและความแม่นยำของข้อมูลแบบ Real-time",
    syncCode: "คัดลอกรหัสซิงก์",
    enterSync: "ใส่รหัสซิงก์",
    adminOnly: "เฉพาะแอดมิน",
    dashboard: "แดชบอร์ด",
    assets: "เครื่องจักร",
    tasks: "งานมอบหมาย",
    messages: "ข้อความ",
    personnel: "บุคลากร",
    inspector: "ตรวจเช็ค",
    history: "ประวัติ",
    trash: "ถังขยะ",
    aiHelp: "วิศวกร AI",
    logout: "ออกจากระบบ",
    sync: "ซิงก์ข้อมูล",
    welcome: "ยินดีต้อนรับ",
    ops: "ปฏิบัติการ",
    staffTerminal: "พนักงาน",
    adminAccess: "เข้าสู่ระบบแอดมิน",
  },
  EN: {
    hubTitle: "Enterprise Resource Hub",
    hubSubtitle: "Real-time Data Integrity & Security",
    syncCode: "Copy Sync Code",
    enterSync: "Enter Sync Code",
    adminOnly: "Admin Only",
    dashboard: "Dashboard",
    assets: "Assets",
    tasks: "Tasks",
    messages: "Messages",
    personnel: "Personnel",
    inspector: "Inspector",
    history: "History",
    trash: "Trash Bin",
    aiHelp: "AI Engineer",
    logout: "Sign Out",
    sync: "SYNC",
    welcome: "Welcome",
    ops: "Operations",
    staffTerminal: "Staff Terminal",
    adminAccess: "Admin Access",
  }
};

const INITIAL_PERSONNEL: Personnel[] = [
  { id: 'P-001', name: 'นายมานะ สุขสบาย', role: PersonnelRole.OPERATOR, info: 'Production', firstName: 'มานะ', lastName: 'สุขสบาย', title: 'นาย' },
  { id: 'P-002', name: 'นางสาววิภา ใจดี', role: PersonnelRole.SUPERVISOR, info: 'Control', firstName: 'วิภา', lastName: 'ใจดี', title: 'นางสาว' },
  { id: 'P-003', name: 'นายสมชาย มั่นคง', role: PersonnelRole.ENGINEER, info: 'Maintenance', firstName: 'สมชาย', lastName: 'มั่นคง', title: 'นาย' },
];

const dbChannel = new BroadcastChannel('tmc_factory_sync_stable_v1');

const PortalHub: React.FC<{ 
  user: User, 
  tasks: Task[], 
  onSelect: (tab: string) => void,
  onExport: () => void,
  onImport: (file: File) => void,
  generateSyncCode: () => string,
  applySyncCode: (code: string) => void,
  t: any,
  appUrl: string,
  setAppUrl: (url: string) => void
}> = ({ user, tasks, onSelect, onExport, onImport, generateSyncCode, applySyncCode, t, appUrl, setAppUrl }) => {
  const isAdmin = user.role === UserRole.ADMIN;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temp, setTemp] = useState(26.4);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setTemp(t => +(t + (Math.random() * 0.2 - 0.1)).toFixed(1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  const pendingTasksCount = useMemo(() => tasks.filter(t => 
    (t.assigneeName === user.name || t.targetDepartment === user.department) && 
    t.status !== TaskStatus.COMPLETED
  ).length, [tasks, user.name, user.department]);

  const handleCopyAppLink = () => {
    const finalUrl = appUrl || window.location.href;
    if (finalUrl.startsWith('blob:')) {
      alert('คำเตือน: ลิงค์ปัจจุบันเป็น Blob (ชั่วคราว) ซึ่งไม่สามารถเปิดในหน้าต่างใหม่ได้\nกรุณากดปุ่ม "ตั้งค่า URL จริง" เพื่อระบุลิงค์แอปที่ถูกต้องของคุณก่อนแชร์');
      return;
    }
    navigator.clipboard.writeText(finalUrl);
    alert('คัดลอกลิงค์แอปแล้ว!\n' + finalUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
  };

  const isBlob = window.location.href.startsWith('blob:');

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-center gap-6 animate-in slide-in-from-top-4 duration-700">
        <div className="bg-white px-8 py-5 rounded-[2rem] border-2 border-slate-50 shadow-sm flex items-center gap-4 transition-all hover:border-blue-200">
          <span className="text-3xl animate-pulse">🌡️</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temp</span>
            <span className="text-xl font-black text-slate-700">{temp} °C</span>
          </div>
        </div>
        <div className="bg-slate-900 px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4">
          <span className="text-3xl text-amber-400">🕒</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Shift Time</span>
            <span className="text-xl font-black text-white font-mono">
              {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <p className="text-indigo-600 font-black text-[10px] uppercase tracking-[0.5em]">TMC Infrastructure v6.5</p>
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">{t.hubTitle}</h2>
        <p className="text-slate-400 max-w-xl mx-auto font-medium italic">{t.hubSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        <div className="group relative p-10 rounded-[3.5rem] border-2 bg-gradient-to-br from-indigo-600 to-blue-700 border-indigo-400 shadow-xl transition-all duration-500 overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div className="p-5 bg-white/20 text-white rounded-[1.8rem] text-4xl backdrop-blur-md">🔗</div>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${isBlob ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {isBlob ? 'Temporary Link' : 'Ready to Share'}
            </div>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tight">Access Link</h3>
          <p className="text-indigo-100 text-xs mt-2 font-medium">คัดลอกลิงค์นี้เพื่อส่งต่อให้ผู้อื่นทดลองใช้</p>
          
          <div className="mt-8 space-y-4">
             <div className="bg-white/10 backdrop-blur-md p-5 rounded-[2rem] border border-white/20 relative group/url">
               <div className="flex justify-between items-center mb-2">
                 <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Production URL</p>
                 <button 
                  onClick={() => setIsEditingUrl(!isEditingUrl)}
                  className="text-[9px] font-black text-white bg-indigo-500/40 px-3 py-1 rounded-full hover:bg-white/20 transition-all"
                 >
                   {isEditingUrl ? 'SAVE' : 'EDIT'}
                 </button>
               </div>
               
               {isEditingUrl ? (
                 <input 
                   type="text" 
                   value={appUrl}
                   onChange={(e) => setAppUrl(e.target.value)}
                   placeholder="เช่น https://your-factory.com"
                   className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-white/60 font-mono"
                 />
               ) : (
                 <p className="text-[10px] font-mono text-white truncate opacity-80 select-all">
                   {appUrl || (isBlob ? '⚠️ กรุณาตั้งค่า URL จริง' : window.location.href)}
                 </p>
               )}
               
               {isBlob && !appUrl && (
                 <p className="mt-3 text-[9px] text-amber-300 font-bold leading-relaxed">
                   * ลิงค์ปัจจุบัน (blob) ไม่สามารถแชร์ได้ กรุณาระบุ URL ของเว็บไซต์คุณในช่องแก้ไขด้านบน
                 </p>
               )}
             </div>

             <button 
               onClick={handleCopyAppLink} 
               className="w-full py-5 bg-white text-indigo-700 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
             >
               📋 คัดลอกลิงค์แอป (COPY URL)
             </button>
          </div>
        </div>

        <div 
          onClick={() => isAdmin ? onSelect('dashboard') : onSelect('machines')}
          className={`group relative p-10 rounded-[3.5rem] border-2 transition-all duration-500 overflow-hidden ${
            isAdmin 
              ? 'bg-[#1E1B4B] border-indigo-900 cursor-pointer hover:translate-y-[-10px] hover:shadow-[0_35px_60px_-15px_rgba(30,27,75,0.3)]' 
              : 'bg-white border-slate-100 cursor-pointer hover:translate-y-[-10px] hover:shadow-[0_35px_60px_-15px_rgba(30,27,75,0.05)]'
          }`}
        >
          <div className="flex justify-between items-start mb-16">
            <div className={`p-5 rounded-[1.8rem] ${isAdmin ? 'bg-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform' : 'bg-blue-50 text-blue-600'}`}>
              <span className="text-4xl">{isAdmin ? '📊' : '⚙️'}</span>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>
              {isAdmin ? 'Admin' : 'Status View'}
            </div>
          </div>
          <h3 className={`text-3xl font-black tracking-tight ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{isAdmin ? t.dashboard : t.assets}</h3>
        </div>

        <div 
          onClick={() => onSelect('inspection')}
          className="group relative p-10 rounded-[3.5rem] border-2 bg-white border-slate-100 cursor-pointer hover:translate-y-[-10px] hover:shadow-[0_35px_60px_-15px_rgba(59,130,246,0.1)] transition-all duration-500"
        >
          <div className="flex justify-between items-start mb-16">
            <div className="p-5 bg-blue-50 text-blue-600 rounded-[1.8rem] group-hover:scale-110 transition-transform text-4xl">📋</div>
            <div className="flex flex-col items-end gap-2">
               <div className="px-4 py-1.5 bg-blue-600 text-[9px] font-black text-white rounded-full uppercase tracking-widest shadow-lg">
                 {t.ops}
               </div>
               {!isAdmin && pendingTasksCount > 0 && (
                 <div className="px-3 py-1 bg-rose-500 text-[8px] font-black text-white rounded-xl animate-bounce shadow-lg">
                   {pendingTasksCount} Alerts
                 </div>
               )}
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t.inspector}</h3>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-slate-50 border border-slate-200 p-8 rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl text-2xl">📡</div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Cloud Sync</p>
                 <h4 className="font-black text-slate-800">สำรองและกู้คืนฐานข้อมูลโรงงาน</h4>
              </div>
           </div>
           <div className="flex gap-4">
              <button onClick={onExport} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                💾 Backup to JSON
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md">
                📂 Restore Data
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
           </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const KEYS = useMemo(() => ({
    MACHINES: 'tmc_db_machines',
    RECORDS: 'tmc_db_records',
    TRASH_RECORDS: 'tmc_db_trash_records',
    TRASH_TASKS: 'tmc_db_trash_tasks',
    TRASH_MACHINES: 'tmc_db_trash_machines',
    TRASH_PERSONNEL: 'tmc_db_trash_personnel',
    PERSONNEL: 'tmc_db_personnel',
    DEPARTMENTS: 'tmc_db_departments',
    NOTIFS: 'tmc_db_notifs',
    TASKS: 'tmc_db_tasks',
    CHAT: 'tmc_db_chat',
    SESSION: 'tmc_active_session_v2', 
    LANG: 'tmc_app_lang',
    APP_URL: 'tmc_app_url'
  }), []);

  const [language, setLanguage] = useState<'TH' | 'EN'>(() => {
    return (localStorage.getItem(KEYS.LANG) as 'TH' | 'EN') || 'TH';
  });

  const [appUrl, setAppUrl] = useState<string>(() => {
    return localStorage.getItem(KEYS.APP_URL) || '';
  });

  const t = translations[language];

  useEffect(() => {
    localStorage.setItem(KEYS.LANG, language);
  }, [language, KEYS.LANG]);

  useEffect(() => {
    localStorage.setItem(KEYS.APP_URL, appUrl);
  }, [appUrl, KEYS.APP_URL]);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(KEYS.SESSION);
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);
  const [activeTab, setActiveTab] = useState('home-hub');
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  const [editingInspectionRecord, setEditingInspectionRecord] = useState<InspectionRecord | null>(null);
  const [inspectionDraft, setInspectionDraft] = useState<any>(null);
  
  const [personnel, setPersonnel] = useState<Personnel[]>(() => {
    const data = localStorage.getItem(KEYS.PERSONNEL);
    try { 
      const parsed = data ? JSON.parse(data) : [];
      if (parsed.length === 0) {
        localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
        return INITIAL_PERSONNEL;
      }
      return parsed; 
    } catch { 
      localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(INITIAL_PERSONNEL));
      return INITIAL_PERSONNEL; 
    }
  });

  const [departments, setDepartments] = useState<string[]>(() => {
    const data = localStorage.getItem(KEYS.DEPARTMENTS);
    const initialDepts = ['Control', 'Production', 'Maintenance'];
    if (data) {
      try { 
        const parsed = JSON.parse(data); 
        return parsed.length > 0 ? parsed : initialDepts;
      } catch { return initialDepts; }
    }
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(initialDepts));
    return initialDepts;
  });

  const [machines, setMachines] = useState<Machine[]>(() => {
    const data = localStorage.getItem(KEYS.MACHINES);
    try { 
      const parsed = data ? JSON.parse(data) : [];
      if (parsed.length === 0) {
        localStorage.setItem(KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
        return INITIAL_MACHINES;
      }
      return parsed; 
    } catch { 
      localStorage.setItem(KEYS.MACHINES, JSON.stringify(INITIAL_MACHINES));
      return INITIAL_MACHINES; 
    }
  });

  const [records, setRecords] = useState<InspectionRecord[]>(() => {
    const data = localStorage.getItem(KEYS.RECORDS);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const data = localStorage.getItem(KEYS.TASKS);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const data = localStorage.getItem(KEYS.CHAT);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const data = localStorage.getItem(KEYS.NOTIFS);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });

  const [deletedRecords, setDeletedRecords] = useState<InspectionRecord[]>(() => {
    const data = localStorage.getItem(KEYS.TRASH_RECORDS);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });
  
  const [deletedTasks, setDeletedTasks] = useState<Task[]>(() => {
    const data = localStorage.getItem(KEYS.TRASH_TASKS);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });
  
  const [deletedMachines, setDeletedMachines] = useState<Machine[]>(() => {
    const data = localStorage.getItem(KEYS.TRASH_MACHINES);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });
  
  const [deletedPersonnel, setDeletedPersonnel] = useState<Personnel[]>(() => {
    const data = localStorage.getItem(KEYS.TRASH_PERSONNEL);
    try { return data ? JSON.parse(data) : []; } catch { return []; }
  });

  useEffect(() => {
    if (currentUser && currentUser.id !== 'ADMIN') {
      const latestInfo = personnel.find(p => p.id === currentUser.id);
      if (latestInfo) {
        const needsUpdate = latestInfo.name !== currentUser.name || 
                           latestInfo.info !== currentUser.department || 
                           latestInfo.role !== currentUser.personnelRole;
        if (needsUpdate) {
          const updatedUser = { 
            ...currentUser, 
            name: latestInfo.name, 
            department: latestInfo.info, 
            personnelRole: latestInfo.role 
          };
          setCurrentUser(updatedUser);
          localStorage.setItem(KEYS.SESSION, JSON.stringify(updatedUser));
        }
      }
    }
  }, [personnel, currentUser, KEYS.SESSION]);

  const [isMachineFormOpen, setIsMachineFormOpen] = useState(false);
  const [selectedMachineForEdit, setSelectedMachineForEdit] = useState<Machine | null>(null);

  const [toasts, setToasts] = useState<any[]>([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'SYNCING' | 'ERROR'>('CONNECTED');

  const addToast = useCallback((title: string, message: string, type: string, priority: NotificationPriority = NotificationPriority.LOW, senderId?: string, targetId?: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type, priority, senderId, targetId }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000);
  }, []);

  const addNotification = useCallback((title: string, message: string, priority: NotificationPriority, category: any, targetUserName?: string, targetDepartment?: string, senderId?: string, targetId?: string) => {
    const newNotif: Notification = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      title, message, priority, category, 
      targetUserName: targetUserName?.trim(), 
      targetDepartment: targetDepartment?.trim(),
      timestamp: new Date().toISOString(),
      read: false, senderId, targetId
    };
    
    setNotifications(prev => {
        const updated = [newNotif, ...prev].slice(0, 100);
        localStorage.setItem(KEYS.NOTIFS, JSON.stringify(updated));
        return updated;
    });

    const finalSenderId = senderId || currentUser?.id || 'SYSTEM';
    dbChannel.postMessage({ type: 'NEW_NOTIFICATION', notif: newNotif, senderId: finalSenderId });
    addToast(newNotif.title, newNotif.message, newNotif.category, newNotif.priority, newNotif.senderId, newNotif.targetId);
  }, [currentUser?.id, KEYS.NOTIFS, addToast]);

  const syncToDB = useCallback((key: string, dataOrUpdater: any, setter?: (d: any) => void) => {
    const updateStorageAndNotify = (newData: any) => {
      try {
        if (newData === undefined) return;
        localStorage.setItem(key, JSON.stringify(newData));
        dbChannel.postMessage({ type: 'SYNC_RELOAD', senderId: currentUser?.id || 'ANONYMOUS', key, payload: newData });
      } catch (e) {
        if (e instanceof Error && e.name === 'QuotaExceededError') {
          alert("คำเตือน: หน่วยความจำในเครื่องเต็ม ไม่สามารถบันทึกข้อมูลเพิ่มเติมได้ กรุณาลบข้อมูลในถังขยะหรือรูปภาพที่ไม่จำเป็นออก");
        }
        console.error("Storage error", e);
      }
    };

    if (setter) {
      setter((prev: any) => {
        const newData = typeof dataOrUpdater === 'function' ? dataOrUpdater(prev) : dataOrUpdater;
        updateStorageAndNotify(newData);
        return newData;
      });
    } else {
      updateStorageAndNotify(dataOrUpdater);
    }
  }, [currentUser?.id, KEYS]);

  // FIX: ตรรกะการอัปเดตสุขภาพเครื่องจักรให้แม่นยำและเสถียรที่สุด
  useEffect(() => {
    let hasChanges = false;
    const nextMachines = machines.map(m => {
      const machineHistory = records
        .filter(r => r.machineId === m.id && !r.deletedAt)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      let targetStatus = MachineStatus.OPERATIONAL;
      let targetEff = 100;
      let targetDate = '-';

      if (machineHistory.length > 0) {
        const latest = machineHistory[0];
        targetStatus = latest.overallStatus;
        targetDate = latest.date.split('T')[0];
        const statusItems = Object.values(latest.values).filter(v => v && typeof v === 'object' && (v as any).status);
        const normalCount = statusItems.filter(v => (v as any).status === 'NORMAL').length;
        targetEff = statusItems.length > 0 ? Math.round((normalCount / statusItems.length) * 100) : 100;
      }

      if (m.status !== targetStatus || m.efficiency !== targetEff || m.lastInspection !== targetDate) {
        hasChanges = true;
        return { ...m, status: targetStatus, efficiency: targetEff, lastInspection: targetDate };
      }
      return m;
    });

    if (hasChanges) {
      localStorage.setItem(KEYS.MACHINES, JSON.stringify(nextMachines));
      setMachines(nextMachines);
      dbChannel.postMessage({ type: 'SYNC_RELOAD', senderId: currentUser?.id || 'SYSTEM', key: KEYS.MACHINES, payload: nextMachines });
    }
  }, [records, machines, currentUser?.id, KEYS]);

  const loadDatabase = useCallback(() => {
    try {
      setDbStatus('SYNCING');
      const getStored = (key: string) => {
        const data = localStorage.getItem(key);
        if (!data) return null;
        try { return JSON.parse(data); } catch (e) { return null; }
      };

      setMessages(getStored(KEYS.CHAT) || []);
      setMachines(getStored(KEYS.MACHINES) || INITIAL_MACHINES);
      setRecords(getStored(KEYS.RECORDS) || []);
      setTasks(getStored(KEYS.TASKS) || []);
      setNotifications(getStored(KEYS.NOTIFS) || []);
      
      const storedPersonnel = getStored(KEYS.PERSONNEL);
      setPersonnel(storedPersonnel && storedPersonnel.length > 0 ? storedPersonnel : INITIAL_PERSONNEL);
      
      setDepartments(getStored(KEYS.DEPARTMENTS) || ['Control', 'Production', 'Maintenance']);

      setDeletedRecords(getStored(KEYS.TRASH_RECORDS) || []);
      setDeletedTasks(getStored(KEYS.TRASH_TASKS) || []);
      setDeletedMachines(getStored(KEYS.TRASH_MACHINES) || []);
      setDeletedPersonnel(getStored(KEYS.TRASH_PERSONNEL) || []);
      
      setDbStatus('CONNECTED');
    } catch (e) {
      setDbStatus('ERROR');
    }
  }, [KEYS, INITIAL_MACHINES]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      try {
        const payload = e.newValue ? JSON.parse(e.newValue) : null;
        switch(e.key) {
          case KEYS.CHAT: setMessages(payload || []); break;
          case KEYS.NOTIFS: setNotifications(payload || []); break;
          case KEYS.TASKS: setTasks(payload || []); break;
          case KEYS.MACHINES: setMachines(payload || INITIAL_MACHINES); break;
          case KEYS.PERSONNEL: setPersonnel(payload && payload.length > 0 ? payload : INITIAL_PERSONNEL); break;
          case KEYS.DEPARTMENTS: setDepartments(payload || []); break;
          case KEYS.RECORDS: setRecords(payload || []); break;
          case KEYS.TRASH_RECORDS: setDeletedRecords(payload || []); break;
          case KEYS.TRASH_TASKS: setDeletedTasks(payload || []); break;
          case KEYS.TRASH_MACHINES: setDeletedMachines(payload || []); break;
          case KEYS.TRASH_PERSONNEL: setDeletedPersonnel(payload || []); break;
        }
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [KEYS, INITIAL_MACHINES]);

  useEffect(() => {
    const handleRemoteUpdate = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;
      const { type, senderId, notif, key, payload } = data;

      const myCurrentId = currentUser?.id || 'ANONYMOUS';
      if (senderId === myCurrentId) return;

      if (type === 'NEW_NOTIFICATION' && notif) {
        const isSystemAlert = notif.category === 'system';
        const myName = currentUser?.name?.trim()?.toLowerCase();
        const isAdminUser = currentUser?.role === UserRole.ADMIN;
        const targetName = notif.targetUserName?.trim()?.toLowerCase();
        const myId = currentUser?.role === UserRole.ADMIN ? 'ADMIN' : currentUser?.id;
        
        const isTargetMe = targetName === myName || (isAdminUser && targetName === 'admin tmc') || notif.targetId === myId;
        const isTargetMyDept = notif.targetDepartment && notif.targetDepartment === currentUser?.department;

        if (isSystemAlert || isTargetMe || isTargetMyDept) {
          const updatedNotifs = JSON.parse(localStorage.getItem(KEYS.NOTIFS) || '[]');
          setNotifications(updatedNotifs);
          addToast(notif.title, notif.message, notif.category, notif.priority, notif.senderId, notif.targetId);
        }
        return;
      }

      if (type === 'SYNC_RELOAD' && payload) {
        const currentData = localStorage.getItem(key);
        if (currentData === JSON.stringify(payload)) return;

        switch(key) {
          case KEYS.CHAT: setMessages(payload); break;
          case KEYS.NOTIFS: setNotifications(payload); break;
          case KEYS.TASKS: setTasks(payload); break;
          case KEYS.MACHINES: setMachines(payload); break;
          case KEYS.PERSONNEL: setPersonnel(payload && payload.length > 0 ? payload : INITIAL_PERSONNEL); break;
          case KEYS.DEPARTMENTS: setDepartments(payload); break;
          case KEYS.RECORDS: setRecords(payload); break;
          case KEYS.TRASH_RECORDS: setDeletedRecords(payload); break;
          case KEYS.TRASH_TASKS: setDeletedTasks(payload); break;
          case KEYS.TRASH_MACHINES: setDeletedMachines(payload); break;
          case KEYS.TRASH_PERSONNEL: setDeletedPersonnel(payload); break;
        }
      }
    };
    dbChannel.addEventListener('message', handleRemoteUpdate);
    return () => {
      dbChannel.removeEventListener('message', handleRemoteUpdate);
    };
  }, [currentUser, addToast, KEYS, INITIAL_PERSONNEL]);

  useEffect(() => {
    loadDatabase();
    setTimeout(() => setIsSystemLoading(false), 500);
  }, [loadDatabase]);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
      if (window.location.hash === '#operator') {
        loadDatabase();
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [loadDatabase]);

  const handleLogout = () => {
    if (currentUser) {
      addNotification(
        'การแจ้งเตือนความปลอดภัย: ออกจากระบบ', 
        `ผู้ใช้: ${currentUser.name} (${currentUser.role}) ได้สิ้นสุดเซสชันการใช้งานแล้ว`, 
        NotificationPriority.LOW, 
        'system',
        undefined, undefined, currentUser.id
      );
    }
    localStorage.removeItem(KEYS.SESSION);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setToasts([]);
  };

  const handleSendMessage = useCallback((text: string, receiverId: string, attachments?: TaskAttachment[]) => {
    if (!currentUser) return;
    const senderId = currentUser.role === UserRole.ADMIN ? 'ADMIN' : currentUser.id;
    const newMessage: ChatMessage = {
      id: `MSG-${Date.now()}`, 
      senderId: senderId, senderName: currentUser.name, receiverId, text, 
      timestamp: new Date().toISOString(), read: false,
      attachments: attachments
    };
    syncToDB(KEYS.CHAT, (prev: ChatMessage[]) => [...prev, newMessage], setMessages);
    
    addNotification(
      attachments && attachments.length > 0 && !text ? 'ได้รับไฟล์แนบใหม่' : 'ข้อความใหม่', 
      text ? `${currentUser.name}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}` : `${currentUser.name} ส่งไฟล์แนบ`, 
      NotificationPriority.LOW, 
      'chat', 
      undefined, undefined, senderId, receiverId
    );
  }, [currentUser, syncToDB, KEYS.CHAT, addNotification]);

  const handleMarkChatRead = useCallback((otherUserId: string) => {
    const myId = currentUser?.role === UserRole.ADMIN ? 'ADMIN' : currentUser?.id;
    if (!myId) return;
    syncToDB(KEYS.CHAT, (prev: ChatMessage[]) => {
      return prev.map(m => 
        (m.senderId === otherUserId && m.receiverId === myId && !m.read)
          ? { ...m, read: true } 
          : m
      );
    }, setMessages);
  }, [currentUser, syncToDB, KEYS.CHAT]);

  const handleInspectionSubmit = (recordData: any) => {
    const newRecord: InspectionRecord = {
      ...recordData,
      id: recordData.id || `REC-${Date.now()}`,
    };

    syncToDB(KEYS.RECORDS, (prev: InspectionRecord[]) => {
      const existingIdx = prev.findIndex(r => r.id === newRecord.id);
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = newRecord;
        return updated;
      }
      return [newRecord, ...prev];
    }, setRecords);

    addNotification(
      newRecord.id.includes('REC-') ? 'อัปเดตการตรวจสอบสำเร็จ' : 'บันทึกการตรวจสอบใหม่สำเร็จ',
      `เครื่องจักร: ${newRecord.machineId} สถานะปัจจุบัน: ${newRecord.overallStatus}`,
      newRecord.overallStatus === MachineStatus.OPERATIONAL ? NotificationPriority.LOW : 
      newRecord.overallStatus === MachineStatus.WARNING ? NotificationPriority.MEDIUM : NotificationPriority.HIGH,
      'machine',
      undefined, undefined, currentUser?.id, newRecord.id
    );
    setActiveTab('history');
    setEditingInspectionRecord(null);
    setInspectionDraft(null); 
    addToast('บันทึกสำเร็จ', 'ข้อมูลการตรวจสอบถูกบันทึกลงระบบแล้ว', 'system');
  };

  const handleMachineSave = (machine: Machine) => {
    syncToDB(KEYS.MACHINES, (prev: Machine[]) => {
      const exists = prev.find(m => m.id === machine.id);
      if (exists) {
        return prev.map(m => m.id === machine.id ? machine : m);
      } else {
        return [...prev, machine];
      }
    }, setMachines);
    
    addNotification(
      selectedMachineForEdit ? 'อัปเดตข้อมูลเครื่องจักร' : 'เพิ่มเครื่องจักรใหม่',
      `เครื่องจักร ${machine.name} (${machine.id}) ได้รับการบันทึกข้อมูลแล้ว`,
      NotificationPriority.LOW,
      'machine',
      undefined, undefined, currentUser?.id
    );
    
    setIsMachineFormOpen(false);
    setSelectedMachineForEdit(null);
    addToast('บันทึกสำเร็จ', `ข้อมูลเครื่องจักร ${machine.name} ถูกจัดเก็บแล้ว`, 'system');
  };

  /**
   * 🛡️ ROBUST ATOMIC DELETION
   * แก้ไขฟังก์ชันให้ทำงานแบบเบ็ดเสร็จ (Calculated before state update) เพื่อแก้ปัญหากดลบแล้วไม่ทำงาน
   */
  const handleMoveRecordToTrash = useCallback((recordId: string) => {
    if (!currentUser) return;
    
    // ตรวจสอบสิทธิ์: เฉพาะ Admin, Supervisor, Engineer เท่านั้น
    const canManage = currentUser.role === UserRole.ADMIN || 
                      currentUser.personnelRole === PersonnelRole.SUPERVISOR || 
                      currentUser.personnelRole === PersonnelRole.ENGINEER;

    if (!canManage) {
      alert('ขออภัย เฉพาะผู้ดูแลระบบ หัวหน้ากะ หรือวิศวกรเท่านั้นที่สามารถย้ายประวัติลงถังขยะได้');
      return;
    }

    // 1. ดึงข้อมูลล่าสุดจาก State หรือ Fallback จาก LocalStorage
    const rawRecords = localStorage.getItem(KEYS.RECORDS);
    const currentRecords: InspectionRecord[] = rawRecords ? JSON.parse(rawRecords) : records;
    const recordToMove = currentRecords.find(r => r.id === recordId);
    
    if (!recordToMove) {
      addToast('ล้มเหลว', 'ไม่พบรายการที่ต้องการลบในฐานข้อมูล', 'system');
      return;
    }

    // 2. คำนวณสถานะใหม่ล่วงหน้า
    const deletedAt = new Date().toISOString();
    const updatedRecords = currentRecords.filter(r => r.id !== recordId);
    
    const rawTrash = localStorage.getItem(KEYS.TRASH_RECORDS);
    const currentTrash: InspectionRecord[] = rawTrash ? JSON.parse(rawTrash) : deletedRecords;
    const updatedTrash = [{ ...recordToMove, deletedAt }, ...currentTrash];

    // 3. บันทึกลง Storage ทันทีเพื่อความมั่นใจ
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updatedRecords));
    localStorage.setItem(KEYS.TRASH_RECORDS, JSON.stringify(updatedTrash));

    // 4. อัปเดต State (React UI)
    setRecords(updatedRecords);
    setDeletedRecords(updatedTrash);

    // 5. ส่งสัญญาณ Sync และแสดงการแจ้งเตือน
    dbChannel.postMessage({ type: 'SYNC_RELOAD', senderId: currentUser.id, key: KEYS.RECORDS, payload: updatedRecords });
    dbChannel.postMessage({ type: 'SYNC_RELOAD', senderId: currentUser.id, key: KEYS.TRASH_RECORDS, payload: updatedTrash });

    addNotification(
      'ย้ายรายการลงถังขยะ', 
      `รายการรหัส ${recordId} ถูกย้ายไปถังขยะโดย ${currentUser.name}`, 
      NotificationPriority.MEDIUM, 
      'trash', 
      undefined, undefined, currentUser.id
    );
    addToast('ลบสำเร็จ', 'ย้ายรายการที่เลือกไปยังถังขยะแล้ว', 'system');
    
  }, [currentUser, records, deletedRecords, KEYS, addNotification, addToast]);

  const handleMoveMachineToTrash = (machineId: string) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return;
    const deletedMachine = { ...machine, deletedAt: new Date().toISOString() };
    syncToDB(KEYS.MACHINES, (prev: Machine[]) => prev.filter(m => m.id !== machineId), setMachines);
    syncToDB(KEYS.TRASH_MACHINES, (prev: Machine[]) => [deletedMachine, ...prev], setDeletedMachines);
    
    addNotification(
      'แจ้งเตือนระบบ: ถอนรายการเครื่องจักร', 
      `Admin (${currentUser?.name}) ได้ทำการถอนเครื่องจักร ${machine.name} (${machine.id}) ออกจากรายการหลักและย้ายไปถังขยะ`, 
      NotificationPriority.MEDIUM, 
      'trash', 
      undefined, undefined, currentUser?.id
    );
  };

  const handleMovePersonnelToTrash = (personId: string) => {
    const p = personnel.find(px => px.id === personId);
    if (!p) return;
    const deletedP = { ...p, deletedAt: new Date().toISOString() };
    
    syncToDB(KEYS.PERSONNEL, (prev: Personnel[]) => prev.filter(px => px.id !== personId), setPersonnel);
    syncToDB(KEYS.TRASH_PERSONNEL, (prev: Personnel[]) => [deletedP, ...prev], setDeletedPersonnel);
    
    addNotification(
      'คำสั่งผู้ดูแลระบบ: ลบรายชื่อบุคลากร', 
      `Admin (${currentUser?.name}) ได้ทำการถอดชื่อพนักงาน ${p.name} ออกจากฐานข้อมูลระบบแล้ว`, 
      NotificationPriority.HIGH, 
      'trash', 
      undefined, undefined, currentUser?.id
    );
  };

  const handleMoveTaskToTrash = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const deletedTask = { ...task, deletedAt: new Date().toISOString() };
    syncToDB(KEYS.TASKS, (prev: Task[]) => prev.filter(t => t.id !== taskId), setTasks);
    syncToDB(KEYS.TRASH_TASKS, (prev: Task[]) => [deletedTask, ...prev], setDeletedTasks);
  };

  const handleExportData = () => {
    const data: Record<string, any> = {};
    Object.values(KEYS).forEach((key: string) => {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tmc_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addToast('สำรองข้อมูลสำเร็จ', 'ไฟล์ถูกดาวน์โหลดเก็บไว้ในเครื่องแล้ว', 'system');
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (typeof result !== 'string') return;
        const data = JSON.parse(result) as Record<string, any>;
        Object.keys(data).forEach((key: string) => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });
        loadDatabase();
        dbChannel.postMessage({ type: 'SYNC_RELOAD', senderId: currentUser?.id || 'ANONYMOUS', key: 'ALL_SYNC', payload: true });
        addToast('กู้คืนข้อมูลสำเร็จ', 'ฐานข้อมูลได้รับการอัปเดตจากไฟล์สำรองแล้ว', 'system');
      } catch (err) {
        alert('ไฟล์ไม่ถูกต้อง หรือเสียหาย');
      }
    };
    reader.readAsText(file);
  };

  const handleToastClick = (toast: any) => {
    if (toast.type === 'task' || toast.category === 'task') {
      setActiveTab('tasks');
      if (toast.targetId) setHighlightTaskId(toast.targetId);
    } else if (toast.type === 'chat' || toast.category === 'chat') {
      setActiveTab('chat');
      if (toast.senderId) setActiveChatUserId(toast.senderId);
    } else if (toast.type === 'system' || toast.category === 'system' || toast.category === 'machine') {
      setActiveTab(toast.category === 'machine' ? 'history' : 'home-hub');
    }
    setToasts(prev => prev.filter(t => t.id !== toast.id));
  };

  const handleSelectTask = useCallback((taskId?: string) => {
    setActiveTab('tasks');
    if (taskId) setHighlightTaskId(taskId);
  }, []);

  const sortedPersonnelList = useMemo(() => {
    return [...personnel]
      .filter(p => !p.deletedAt)
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [personnel]);

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'home-hub': return <PortalHub 
        user={currentUser} tasks={tasks} onSelect={setActiveTab} 
        onExport={handleExportData} onImport={handleImportData} 
        generateSyncCode={() => ""} applySyncCode={() => {}} t={t} 
        appUrl={appUrl} setAppUrl={setAppUrl}
      />;
      case 'dashboard': return <Dashboard machines={machines} />;
      case 'machines': return (
        <>
          <MachineList 
            machines={machines} 
            currentUser={currentUser} 
            onEdit={(m) => { setSelectedMachineForEdit(m); setIsMachineFormOpen(true); }} 
            onDelete={handleMoveMachineToTrash} 
            onAddNew={() => { setSelectedMachineForEdit(null); setIsMachineFormOpen(true); }} 
            onDuplicate={(m) => { 
              const duplicate = { ...m, id: `${m.id}-COPY-${Date.now().toString().slice(-4)}`, name: `${m.name} (Copy)` };
              handleMachineSave(duplicate);
            }} 
          />
          {isMachineFormOpen && (
            <MachineForm 
              machine={selectedMachineForEdit} 
              onSave={handleMachineSave} 
              onClose={() => { setIsMachineFormOpen(false); setSelectedMachineForEdit(null); }} 
            />
          )}
        </>
      );
      case 'tasks': return <TaskManagement tasks={tasks} personnel={personnel} currentUser={currentUser} highlightTaskId={highlightTaskId} onClearHighlight={() => setHighlightTaskId(null)} onAddTask={(t) => {
        const newTask = { ...t, id: `T-${Date.now()}`, createdAt: new Date().toISOString() };
        syncToDB(KEYS.TASKS, (prev: Task[]) => [...prev, newTask], setTasks);
        addNotification('มอบหมายงานใหม่', `ระบุ: ${t.title}`, t.priority, 'task', t.assigneeName, t.targetDepartment, currentUser.id, newTask.id);
      }} onUpdateTask={(t) => {
        const oldTask = tasks.find(tk => tk.id === t.id);
        syncToDB(KEYS.TASKS, (prev: Task[]) => prev.map(tk => tk.id === t.id ? t : tk), setTasks);
        if (!oldTask) return;
        if (currentUser.id !== 'ADMIN') {
           if (oldTask.status === TaskStatus.PENDING && t.status === TaskStatus.IN_PROGRESS) {
             addNotification('รับทราบงานมอบหมาย', `${currentUser.name} เริ่มดำเนินภารกิจ "${t.title}" แล้ว`, NotificationPriority.LOW, 'task', 'Admin TMC', 'Control', currentUser.id, t.id);
           }
           else if (oldTask.status !== TaskStatus.COMPLETED && t.status === TaskStatus.COMPLETED) {
             addNotification('ภารกิจเสร็จสิ้น', `${currentUser.name} รายงานผลสำเร็จของภารกิจ "${t.title}"`, NotificationPriority.MEDIUM, 'task', 'Admin TMC', 'Control', currentUser.id, t.id);
           }
           else if (oldTask.status === t.status && oldTask.progress !== t.progress) {
             addNotification('อัปเดตการดำเนินงาน', `${currentUser.name} รายงานความคืบหน้างาน "${t.title}" เป็น ${t.progress || 0}%`, NotificationPriority.LOW, 'task', 'Admin TMC', 'Control', currentUser.id, t.id);
           }
        }
      }} onDeleteTask={handleMoveTaskToTrash} />;
      case 'chat': return <InternalChat messages={messages} currentUser={currentUser} personnel={personnel} onSendMessage={handleSendMessage} selectedChatUser={activeChatUserId} onSelectChatUser={setActiveChatUserId} onMarkRead={handleMarkChatRead} />;
      case 'inspection': return <InspectionForm 
        machines={machines} personnel={personnel} currentUser={currentUser} 
        onSubmit={handleInspectionSubmit} 
        editingRecord={editingInspectionRecord}
        draft={inspectionDraft}
        onDraftChange={setInspectionDraft}
        onBack={() => setActiveTab('home-hub')}
      />;
      case 'history': return <HistoryList records={records} machines={machines} personnel={personnel} user={currentUser} onEditRecord={(r) => {
        const canEdit = currentUser.role === UserRole.ADMIN || 
                        currentUser.personnelRole === PersonnelRole.SUPERVISOR || 
                        currentUser.personnelRole === PersonnelRole.ENGINEER;
        if (!canEdit) {
          alert('ขออภัย เฉพาะผู้ดูแลระบบ หัวหน้ากะ หรือวิศวกรเท่านั้นที่สามารถแก้ไขประวัติได้');
          return;
        }
        setEditingInspectionRecord(r);
        setActiveTab('inspection');
      }} onDeleteRecord={handleMoveRecordToTrash} />;
      case 'personnel': return <PersonnelManagement 
        personnel={personnel} 
        departments={departments}
        userRole={currentUser.role} 
        onAdd={(p) => {
          syncToDB(KEYS.PERSONNEL, (prev: Personnel[]) => [...prev, p], setPersonnel);
          addNotification('เพิ่มรายชื่อบุคลากรใหม่', `พนักงาน: ${p.name} ตำแหน่ง: ${p.role} ถูกเพิ่มเข้าสู่ระบบแล้ว`, NotificationPriority.LOW, 'system', undefined, undefined, currentUser.id);
        }} 
        onUpdate={(p) => {
          syncToDB(KEYS.PERSONNEL, (prev: Personnel[]) => prev.map(old => old.id === p.id ? p : old), setPersonnel);
          addNotification('อัปเดตข้อมูลบุคลากร', `ข้อมูลของพนักงาน: ${p.name} ได้รับการแก้ไขแล้ว`, NotificationPriority.LOW, 'system', undefined, undefined, currentUser.id);
        }} 
        onDelete={handleMovePersonnelToTrash} 
        onAddDept={(dept) => {
          if (!departments.includes(dept)) {
            syncToDB(KEYS.DEPARTMENTS, (prev: string[]) => [...prev, dept], setDepartments);
          }
        }}
        onUpdateDept={(oldName, newName) => {
          if (oldName === newName) return;
          syncToDB(KEYS.DEPARTMENTS, (prev: string[]) => prev.map(d => d === oldName ? newName : d), setDepartments);
          syncToDB(KEYS.PERSONNEL, (prev: Personnel[]) => prev.map(p => p.info === oldName ? { ...p, info: newName } : p), setPersonnel);
        }}
        onDeleteDept={(dept) => {
           syncToDB(KEYS.DEPARTMENTS, (prev: string[]) => prev.filter(d => d !== dept), setDepartments);
        }}
      />;
      case 'ai-help': return <AIChatAssistant />;
      case 'trash': return <TrashBin 
        deletedRecords={deletedRecords} 
        deletedTasks={deletedTasks} 
        deletedMachines={deletedMachines}
        deletedPersonnel={deletedPersonnel}
        machines={machines}
        onRestoreRecord={(r) => {
          const restored = { ...r };
          delete restored.deletedAt;
          syncToDB(KEYS.TRASH_RECORDS, (prev: InspectionRecord[]) => prev.filter(x => x.id !== r.id), setDeletedRecords);
          syncToDB(KEYS.RECORDS, (prev: InspectionRecord[]) => {
            return [restored, ...prev];
          }, setRecords);
        }}
        onDeleteRecordPermanent={(id) => syncToDB(KEYS.TRASH_RECORDS, (prev: InspectionRecord[]) => prev.filter(x => x.id !== id), setDeletedRecords)}
        onRestoreTask={(t) => {
          const restored = { ...t };
          delete restored.deletedAt;
          syncToDB(KEYS.TRASH_TASKS, (prev: Task[]) => prev.filter(x => x.id !== t.id), setDeletedTasks);
          syncToDB(KEYS.TASKS, (prev: Task[]) => [restored, ...prev], setTasks);
        }}
        onDeleteTaskPermanent={(id) => syncToDB(KEYS.TRASH_TASKS, (prev: Task[]) => prev.filter(x => x.id !== id), setDeletedTasks)}
        onRestoreMachine={(m) => {
          const restored = { ...m };
          delete restored.deletedAt;
          syncToDB(KEYS.TRASH_MACHINES, (prev: Machine[]) => prev.filter(x => x.id !== m.id), setDeletedMachines);
          syncToDB(KEYS.MACHINES, (prev: Machine[]) => [restored, ...prev], setMachines);
        }}
        onDeleteMachinePermanent={(id) => syncToDB(KEYS.TRASH_MACHINES, (prev: Machine[]) => prev.filter(x => x.id !== id), setDeletedMachines)}
        onRestorePersonnel={(p) => {
          const restored = { ...p };
          delete restored.deletedAt;
          syncToDB(KEYS.TRASH_PERSONNEL, (prev: Personnel[]) => prev.filter(x => x.id !== p.id), setDeletedPersonnel);
          syncToDB(KEYS.PERSONNEL, (prev: Personnel[]) => [restored, ...prev], setPersonnel);
        }}
        onDeletePersonnelPermanent={(id) => syncToDB(KEYS.TRASH_PERSONNEL, (prev: Personnel[]) => prev.filter(x => x.id !== id), setDeletedPersonnel)}
      />;
      default: return null;
    }
  };

  if (isSystemLoading) return null;

  if (!isLoggedIn) {
    const handleLoginSuccess = (user: User) => {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      setCurrentUser(user);
      setIsLoggedIn(true);
      addNotification(
        'การแจ้งเตือนความปลอดภัย: เข้าสู่ระบบใหม่', 
        `ผู้ใช้: ${user.name} (${user.role}) ได้เริ่มต้นเซสชันการใช้งานใหม่`, 
        NotificationPriority.MEDIUM, 
        'system',
        undefined, undefined, user.id
      );
    };
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 font-prompt">
        <div className="max-w-4xl w-full text-center space-y-12">
          <TMCLogo className="text-indigo-950 mx-auto" size={140} />
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Thai Modern Case</h1>
          {currentHash === '#admin' ? (
             <div className="w-full max-w-md mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl space-y-8">
               <h2 className="text-2xl font-black">{t.adminAccess}</h2>
               <form onSubmit={(e) => {
                  e.preventDefault();
                  handleLoginSuccess({ id: 'ADMIN', name: 'Admin TMC', email: 'admin@factory.com', role: UserRole.ADMIN, department: 'Control' });
               }} className="space-y-4">
                  <input type="text" placeholder="Admin ID" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none focus:border-indigo-600 font-bold" />
                  <input type="password" placeholder="Passcode" className="w-full bg-slate-50 border-2 rounded-2xl px-6 py-4 outline-none focus:border-indigo-600 font-bold" />
                  <button type="submit" className="w-full bg-indigo-950 text-white font-black py-5 rounded-2xl hover:bg-black transition-all">Login</button>
                  <button type="button" onClick={() => window.location.hash = ''} className="w-full py-2 text-slate-400 text-xs font-bold">← Back</button>
               </form>
             </div>
          ) : currentHash === '#operator' ? (
            <div className="w-full max-w-md mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl space-y-8">
              <h2 className="text-2xl font-black">{t.staffTerminal}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const p = personnel.find(px => px.id === selectedPersonnelId);
                if (p) handleLoginSuccess({ 
                  id: p.id, 
                  name: p.name, 
                  email: '', 
                  role: UserRole.USER, 
                  department: p.info,
                  personnelRole: p.role 
                });
              }} className="space-y-6">
                <select value={selectedPersonnelId} onChange={e => setSelectedPersonnelId(e.target.value)} className="w-full bg-slate-50 border-2 border-indigo-200 rounded-3xl px-8 py-5 outline-none font-bold text-lg">
                  <option value="">-- เลือกพนักงาน --</option>
                  {sortedPersonnelList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {sortedPersonnelList.length === 0 && (
                  <p className="text-xs text-rose-500 font-bold">⚠️ ยังไม่มีรายชื่อพนักงานในระบบ กรุณาติดต่อแอดมิน</p>
                )}
                <button type="submit" disabled={!selectedPersonnelId} className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2.5rem] shadow-xl disabled:bg-slate-200 transition-all">Login</button>
                <button type="button" onClick={() => window.location.hash = ''} className="w-full py-2 text-slate-400 text-xs font-bold">← Back</button>
              </form>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <button onClick={() => window.location.hash = 'admin'} className="group bg-[#0F172A] p-12 rounded-[4rem] text-left border border-white/5 shadow-3xl hover:-translate-y-2 transition-all">
                  <h3 className="text-3xl font-black text-white">Management</h3>
                  <p className="mt-8 text-indigo-400 font-black text-xs uppercase tracking-widest">Admin Access →</p>
               </button>
               <button onClick={() => window.location.hash = 'operator'} className="group bg-white p-12 rounded-[4rem] text-left border border-slate-200 shadow-2xl hover:-translate-y-2 transition-all">
                  <h3 className="text-3xl font-black text-slate-900">Line Operations</h3>
                  <p className="mt-8 text-indigo-700 font-black text-xs uppercase tracking-widest">Operator Access →</p>
               </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Layout 
        activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser!} 
        onLogout={handleLogout} notifications={notifications}
        onSelectChatUser={setActiveChatUserId} 
        onSelectTask={handleSelectTask}
        onMarkAsRead={(id) => {
          const updated = notifications.map(n => n.id === id ? {...n, read: true} : n);
          setNotifications(updated);
          localStorage.setItem(KEYS.NOTIFS, JSON.stringify(updated));
        }}
        onClearAll={() => syncToDB(KEYS.NOTIFS, [], setNotifications)}
        onForceSync={loadDatabase} dbStatus={dbStatus}
        language={language}
        onLanguageChange={setLanguage}
        translations={t}
      >
        {renderContent()}
      </Layout>
      <div className="fixed bottom-10 right-10 z-[100] space-y-4 max-w-sm pointer-events-none font-prompt">
        {toasts.map(toast => (
          <div key={toast.id} onClick={() => handleToastClick(toast)} className="bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] border-2 shadow-2xl flex items-start gap-4 pointer-events-auto cursor-pointer group hover:border-indigo-500 animate-in slide-in-from-right-20">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${toast.type === 'task' || toast.category === 'task' ? 'bg-amber-100 text-amber-600' : toast.type === 'chat' || toast.category === 'chat' ? 'bg-indigo-100 text-indigo-600' : toast.category === 'machine' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
              {toast.type === 'task' || toast.category === 'task' ? '📌' : toast.type === 'chat' || toast.category === 'chat' ? '💬' : toast.category === 'machine' ? '📜' : '🔔'}
            </div>
            <div className="flex-1">
               <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{toast.title}</p>
               <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
