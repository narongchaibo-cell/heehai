
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Notification, NotificationPriority } from '../types';
import { TMCLogo } from './Branding';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onForceSync?: () => void;
  dbStatus?: 'CONNECTED' | 'SYNCING' | 'ERROR';
  onBackup?: () => void;
  onRestore?: (file: File) => void;
  onSelectChatUser?: (userId: string) => void;
  onSelectTask?: (taskId?: string) => void;
  language: 'TH' | 'EN';
  onLanguageChange: (lang: 'TH' | 'EN') => void;
  translations: any;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, currentUser, onLogout, 
  notifications, onMarkAsRead, onClearAll, onForceSync, dbStatus = 'CONNECTED', 
  onBackup, onRestore, onSelectChatUser, onSelectTask,
  language, onLanguageChange, translations: t
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'task' | 'machine' | 'chat' | 'system'>('task');
  const popoverRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // กรองการแจ้งเตือนที่เกี่ยวข้องกับ User คนนี้ (เน้นตรวจสอบด้วย ID เป็นหลัก)
  const myNotifications = notifications.filter(n => {
    const myId = currentUser?.role === UserRole.ADMIN ? 'ADMIN' : currentUser?.id;
    const myName = currentUser?.name?.trim()?.toLowerCase();
    const targetName = n.targetUserName?.trim()?.toLowerCase();
    
    // 1. ตรวจสอบจาก targetId (ระบุเฉพาะเจาะจง เช่น แชทส่วนตัว หรือ Task ของฉัน)
    const isTargetMe = n.targetId === myId || targetName === myName || (isAdmin && targetName === 'admin tmc');
    
    // 2. ตรวจสอบจากแผนก
    const isTargetMyDept = n.targetDepartment && n.targetDepartment === currentUser?.department;
    
    if (isTargetMe || isTargetMyDept) return true;
    
    // 3. การแจ้งเตือนระบบที่ทุกคนเห็นได้ หรือ Admin เห็นหมวดหมู่พิเศษได้
    if (n.category === 'system') return true;
    if (isAdmin && (n.category === 'machine' || n.category === 'trash')) return true;

    return false;
  });

  const unreadCount = myNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'home-hub', label: 'TMC Hub', icon: '🏠' },
    { id: 'dashboard', label: t.dashboard, icon: '📊' },
    { id: 'machines', label: t.assets, icon: '⚙️' },
    { id: 'tasks', label: t.tasks, icon: '📌' },
    { id: 'chat', label: t.messages, icon: '💬' },
    { id: 'personnel', label: t.personnel, icon: '👥' },
    { id: 'inspection', label: t.inspector, icon: '📝' },
    { id: 'history', label: t.history, icon: '📜' },
    { id: 'trash', label: t.trash, icon: '🗑️' },
    { id: 'ai-help', label: t.aiHelp, icon: '🤖' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (item.id === 'home-hub' || item.id === 'ai-help') return true;
    if (isAdmin) return true;
    // อนุญาตให้พนักงานทั่วไป (USER) เข้าดูหน้า machines (เครื่องจักร) ได้เพื่อตรวจสอบสถานะแบบ Read-only
    return ['machines', 'tasks', 'chat', 'inspection', 'history'].includes(item.id);
  });

  const getTabNotifications = (tab: 'task' | 'machine' | 'chat' | 'system') => {
    let filtered = [];
    if (tab === 'system') {
      filtered = myNotifications.filter(n => n.category === 'system' || n.category === 'trash');
    } else {
      filtered = myNotifications.filter(n => n.category === tab);
    }
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getUnreadInTab = (tab: 'task' | 'machine' | 'chat' | 'system') => getTabNotifications(tab).filter(n => !n.read).length;

  const handleJumpToCategory = (tab: 'task' | 'machine' | 'chat' | 'system') => {
    switch(tab) {
      case 'task': setActiveTab('tasks'); break;
      case 'machine': setActiveTab('inspection'); break; 
      case 'chat': setActiveTab('chat'); break;
      case 'system': setActiveTab('home-hub'); break;
    }
    setShowNotifications(false);
  };

  const handleNotifClick = (n: Notification) => {
    onMarkAsRead(n.id);
    if (n.category === 'chat') {
      setActiveTab('chat');
      if (onSelectChatUser && n.senderId) onSelectChatUser(n.senderId);
    } else if (n.category === 'task') {
      setActiveTab('tasks');
      if (onSelectTask) onSelectTask(n.targetId);
    } else if (n.category === 'machine') {
      setActiveTab('inspection');
    } else if (n.category === 'trash') {
      setActiveTab('trash');
    }
    setShowNotifications(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-prompt">
      <aside className="w-72 bg-[#1E1B4B] flex flex-col z-20 shadow-2xl shrink-0">
        <div onClick={() => setActiveTab('home-hub')} className="p-8 border-b border-white/5 text-center cursor-pointer hover:bg-white/5 transition-colors">
            <TMCLogo className="text-white mx-auto mb-4" size={60} />
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">Thai Modern Case</h1>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${dbStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span className="text-[9px] text-indigo-300 font-black uppercase tracking-widest">DB: {dbStatus}</span>
            </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-sm ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-indigo-200/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 space-y-3">
          <div className="bg-white/5 rounded-3xl p-5 border border-white/10 backdrop-blur-md text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center font-black">
                {currentUser?.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover rounded-2xl" alt="avatar" /> : currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs truncate">{currentUser?.name || 'Anonymous'}</p>
                <p className="text-[8px] font-black uppercase text-indigo-400">{currentUser?.department || 'Visitor'}</p>
              </div>
            </div>
            <button onClick={onLogout} className="w-full py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-white transition-all">{t.logout}</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-12 py-8 flex justify-between items-center border-b border-slate-100">
          <div>
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">TMC Operation Console</p>
            <h2 className="text-3xl font-black text-[#1E1B4B] tracking-tighter">
              {menuItems.find(m => m.id === activeTab)?.label || 'Console'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={onForceSync} className="h-14 px-8 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 group">
              {t.sync} <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
            </button>

            <div className="relative" ref={settingsRef}>
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${showSettings ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}`}
              >
                <span className={`${showSettings ? 'animate-spin' : ''}`}>⚙️</span>
              </button>
              
              {showSettings && (
                <div className="absolute right-0 mt-6 w-80 bg-white rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-[#1E1B4B] px-8 py-6 text-white">
                    <h3 className="font-black text-[11px] uppercase tracking-widest">SYSTEM SETTINGS</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LANGUAGE / ภาษา</label>
                      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl">
                        <button 
                          onClick={() => onLanguageChange('TH')}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${language === 'TH' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
                        >
                          ไทย (TH)
                        </button>
                        <button 
                          onClick={() => onLanguageChange('EN')}
                          className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${language === 'EN' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
                        >
                          ENGLISH (EN)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={popoverRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl relative transition-all ${showNotifications ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 hover:bg-slate-50'}`}
              >
                🔔
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 border-4 border-white rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-6 w-[28rem] bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-[#1E1B4B] px-8 py-6 text-white flex justify-between items-center">
                    <h3 className="font-black text-[11px] uppercase tracking-widest">NOTIFICATIONS Center</h3>
                    <button onClick={onClearAll} className="text-[9px] font-black uppercase bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all">Clear All</button>
                  </div>

                  <div className="flex bg-slate-50 p-1 border-b border-slate-100">
                    {[
                      { id: 'task', icon: '📌', color: 'text-rose-600' }, 
                      { id: 'machine', icon: '⚙️', color: 'text-slate-500' }, 
                      { id: 'chat', icon: '💬', color: 'text-indigo-500' }, 
                      { id: 'system', icon: '🔔', color: 'text-amber-500' } 
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveNotifTab(tab.id as any)}
                        className={`flex-1 py-5 flex flex-col items-center justify-center gap-1 rounded-xl transition-all relative ${activeNotifTab === tab.id ? 'bg-white shadow-lg border-2 border-slate-900/5 z-10 scale-105' : 'hover:bg-white/50 opacity-60'}`}
                      >
                        <span className={`text-2xl ${tab.color}`}>{tab.icon}</span>
                        {getUnreadInTab(tab.id as any) > 0 && (
                          <span className="absolute top-3 right-5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm border border-white"></span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                     <div className="flex flex-col">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Quick Shortcut</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase">
                          {activeNotifTab === 'task' ? 'งานที่ได้รับมอบหมาย' : 
                           activeNotifTab === 'machine' ? 'ใบตรวจสอบเครื่องจักร' : 
                           activeNotifTab === 'chat' ? 'แชทภายในองค์กร' : 'การแจ้งเตือนหลัก และการเข้า-ออกระบบ'}
                        </p>
                     </div>
                     <button 
                       onClick={() => handleJumpToCategory(activeNotifTab)}
                       className="text-[9px] font-black text-indigo-600 uppercase border-2 border-indigo-100 px-4 py-2 rounded-xl bg-white hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                     >
                       เข้าสู่หน้าหลัก ➔
                     </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 bg-white">
                    {getTabNotifications(activeNotifTab).length > 0 ? (
                      getTabNotifications(activeNotifTab).map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotifClick(n)}
                          className={`p-5 rounded-[2rem] mb-1 cursor-pointer transition-all hover:bg-slate-50 group flex gap-4 border border-transparent hover:border-slate-100 ${!n.read ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${n.priority === NotificationPriority.HIGH ? 'bg-rose-100 text-rose-600 shadow-inner' : 'bg-slate-100 text-slate-400 group-hover:bg-white transition-colors shadow-sm'}`}>
                             {n.category === 'task' ? '📌' : n.category === 'chat' ? '💬' : n.category === 'machine' ? '⚙️' : '🔔'}
                          </div>
                          <div className="flex-1 overflow-hidden">
                             <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-xs font-bold truncate pr-2 ${!n.read ? 'text-indigo-900' : 'text-slate-600'}`}>{n.title}</h4>
                                <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">
                                   {new Date(n.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                             <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 text-center text-slate-300 flex flex-col items-center">
                        <div className="text-5xl mb-4 opacity-10">
                           {activeNotifTab === 'task' ? '📌' : activeNotifTab === 'chat' ? '💬' : activeNotifTab === 'machine' ? '⚙️' : '🔔'}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                          {activeNotifTab === 'system' ? 'ไม่มีข้อมูลการแจ้งเตือนหลัก หรือการเข้า-ออกระบบ' : `ไม่มีรายการในหมวดหมู่ ${activeNotifTab.toUpperCase()}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button onClick={() => setShowNotifications(false)} className="w-full py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm">Close Console</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="px-12 py-12">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
