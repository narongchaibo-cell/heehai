
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { ChatMessage, User, UserRole, Personnel, TaskAttachment } from '../types';

interface InternalChatProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (text: string, receiverId: string, attachments?: TaskAttachment[]) => void;
  personnel: Personnel[];
  onMarkRead: (senderId: string) => void;
  selectedChatUser: string | null;
  onSelectChatUser: (userId: string | null) => void;
}

const MessageItem = memo(({ msg, isMine, showAvatar, timestamp, read, senderInitial, msgId, attachments }: { 
  msg: string, isMine: boolean, showAvatar: boolean, timestamp: string, read: boolean, senderInitial: string, msgId: string, attachments?: TaskAttachment[]
}) => {
  const downloadAttachment = (file: TaskAttachment) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    link.click();
  };

  return (
    <div key={msgId} className={`flex ${isMine ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-1 duration-300`}>
      <div className={`flex items-end gap-3 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black mb-1 ${
          !showAvatar ? 'opacity-0' : (isMine ? 'bg-[#1E1B4B] text-white shadow-md' : 'bg-white border text-indigo-600 shadow-sm')
        }`}>
          {senderInitial}
        </div>

        <div className={`space-y-1 ${isMine ? 'text-right' : 'text-left'}`}>
          <div className={`p-4 rounded-[2rem] text-sm font-medium leading-relaxed flex flex-col gap-3 ${
            isMine 
              ? 'bg-[#1E1B4B] text-white rounded-br-none shadow-[0_10px_25px_-5px_rgba(30,27,75,0.4)]' 
              : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-[0_5px_15px_-3px_rgba(0,0,0,0.05)]'
          }`}>
            {/* Render Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="flex flex-col gap-2">
                {attachments.map((file, i) => (
                  <div key={i} className="max-w-xs">
                    {file.type.startsWith('image/') ? (
                      <div className="rounded-2xl overflow-hidden shadow-sm border border-black/5 cursor-pointer hover:opacity-90" onClick={() => downloadAttachment(file)}>
                        <img src={file.data} alt={file.name} className="w-full h-auto object-cover max-h-60" />
                      </div>
                    ) : (
                      <button 
                        onClick={() => downloadAttachment(file)}
                        className={`flex items-center gap-3 p-3 rounded-2xl w-full text-left transition-all ${isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-indigo-50'}`}
                      >
                        <span className="text-xl">📄</span>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-bold truncate">{file.name}</p>
                          <p className={`text-[8px] font-black uppercase ${isMine ? 'text-indigo-300' : 'text-slate-400'}`}>{file.type.split('/')[1] || 'FILE'}</p>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Render Text */}
            {msg && <p>{msg}</p>}
          </div>
          <div className={`flex items-center gap-2 px-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[9px] font-bold text-slate-400 uppercase">{timestamp}</span>
            {isMine && (
              <div className="flex items-center gap-0.5">
                 <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-500 ${read ? "text-emerald-500" : "text-slate-300"}`}>
                   {read ? "✓✓ Read" : "✓ Sent"}
                 </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const InternalChat: React.FC<InternalChatProps> = ({ 
  messages, currentUser, onSendMessage, personnel, onMarkRead,
  selectedChatUser, onSelectChatUser
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<TaskAttachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const myId = isAdmin ? 'ADMIN' : currentUser.id;

  // กรองรายชื่อพนักงานและเรียงลำดับตามข้อความล่าสุด
  const activeInboxes = useMemo(() => {
    if (!isAdmin) return [];
    
    return personnel.map(staff => {
      const userMsgs = messages.filter(m => 
        (m.senderId === staff.id && (m.receiverId === 'ADMIN' || m.receiverId === currentUser.id)) || 
        ((m.senderId === 'ADMIN' || m.senderId === currentUser.id) && m.receiverId === staff.id)
      );
      
      const unreadCount = userMsgs.filter(m => m.senderId === staff.id && !m.read).length;
      const lastMessage = [...userMsgs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      return {
        id: staff.id,
        name: staff.name,
        unreadCount,
        lastMsgText: lastMessage?.text || (lastMessage?.attachments?.length ? 'Sent an attachment' : 'No conversation started'),
        timestamp: lastMessage?.timestamp || '0',
        role: staff.role
      };
    }).sort((a, b) => {
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [messages, personnel, isAdmin, currentUser.id]);

  const currentChatMessages = useMemo(() => {
    if (!selectedChatUser) return [];
    let filtered = messages.filter(m => 
      (m.senderId === myId && m.receiverId === selectedChatUser) ||
      (m.senderId === selectedChatUser && m.receiverId === myId)
    );

    if (searchQuery.trim()) {
      filtered = filtered.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered;
  }, [messages, selectedChatUser, myId, searchQuery]);

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: ChatMessage[] } = {};
    currentChatMessages.forEach(msg => {
      const date = new Date(msg.timestamp).toLocaleDateString('th-TH', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  }, [currentChatMessages]);

  useEffect(() => {
    if (scrollRef.current && !searchQuery) {
        requestAnimationFrame(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
            }
        });
    }
  }, [currentChatMessages.length, selectedChatUser, searchQuery]);

  useEffect(() => {
    if (selectedChatUser) {
        const hasUnread = messages.some(m => 
          m.senderId === selectedChatUser && 
          m.receiverId === myId && 
          !m.read
        );
        if (hasUnread) {
          setTimeout(() => onMarkRead(selectedChatUser), 300);
        }
    }
  }, [messages, selectedChatUser, myId, onMarkRead]);

  useEffect(() => {
    if (!isAdmin && !selectedChatUser) {
      onSelectChatUser('ADMIN');
    }
  }, [isAdmin, selectedChatUser, onSelectChatUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    (Array.from(files) as File[]).forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`ไฟล์ ${file.name} ใหญ่เกิน 2MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingAttachments(prev => [...prev, {
          name: file.name,
          data: event.target?.result as string,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if ((!trimmed && pendingAttachments.length === 0) || !selectedChatUser) return;
    onSendMessage(trimmed, selectedChatUser, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setInputText('');
    setPendingAttachments([]);
  };

  const getDayLabel = (dateStr: string) => {
    const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    if (dateStr === today) return 'วันนี้';
    if (dateStr === yesterday) return 'เมื่อวานนี้';
    return dateStr;
  };

  const chatPartner = useMemo(() => personnel.find(p => p.id === selectedChatUser), [personnel, selectedChatUser]);

  return (
    <div className="flex h-[calc(100vh-250px)] bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden font-prompt">
      {/* Sidebar History List */}
      <div className="w-80 border-r border-slate-100 bg-slate-50/50 flex flex-col">
        <div className="p-8 border-b border-slate-100 bg-white">
          <h3 className="font-black text-[#1E1B4B] uppercase text-[10px] tracking-[0.2em]">Conversation History</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!isAdmin ? (
            <div className="p-4">
              <button 
                onClick={() => onSelectChatUser('ADMIN')}
                className={`w-full p-6 rounded-[2.2rem] flex items-center gap-4 transition-all ${
                  selectedChatUser === 'ADMIN' ? 'bg-[#1E1B4B] text-white shadow-xl scale-[1.02]' : 'bg-white border text-slate-600 hover:border-indigo-200 shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${selectedChatUser === 'ADMIN' ? 'bg-white/20' : 'bg-slate-100 shadow-inner'}`}>🛡️</div>
                <div className="text-left overflow-hidden">
                  <p className="font-black text-sm">Control Room</p>
                  <p className={`text-[9px] uppercase font-bold truncate ${selectedChatUser === 'ADMIN' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Main Admin Console
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {activeInboxes.map(staff => (
                <button 
                  key={staff.id}
                  onClick={() => onSelectChatUser(staff.id)}
                  className={`w-full p-5 rounded-[2.2rem] flex items-center gap-4 transition-all relative ${
                    selectedChatUser === staff.id ? 'bg-[#1E1B4B] text-white shadow-xl scale-[1.02]' : 'bg-white border text-slate-600 hover:border-indigo-200 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0 shadow-inner ${selectedChatUser === staff.id ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    {staff.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1 overflow-hidden">
                    <p className="font-black text-sm truncate">{staff.name}</p>
                    <p className={`text-[9px] truncate font-bold uppercase tracking-tighter ${selectedChatUser === staff.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {staff.lastMsgText}
                    </p>
                  </div>
                  {staff.unreadCount > 0 && (
                    <div className="w-6 h-6 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce shrink-0">
                      {staff.unreadCount}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChatUser ? (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm z-10 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${selectedChatUser === 'ADMIN' ? 'bg-indigo-950 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                   {selectedChatUser === 'ADMIN' ? '🛡️' : (chatPartner?.name?.charAt(0) || 'U')}
                 </div>
                 <div>
                    <h4 className="font-black text-[#1E1B4B] text-xl tracking-tight">
                      {selectedChatUser === 'ADMIN' ? 'Central Control Room' : (chatPartner?.name || 'Unknown User')}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      {selectedChatUser === 'ADMIN' ? 'Secure Protocol Active' : (chatPartner?.role || 'Deactivated Account')}
                    </p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                {showSearch && (
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาในประวัติ..."
                    className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold outline-none border border-slate-200 focus:border-indigo-400 animate-in slide-in-from-right-2"
                  />
                )}
                <button 
                  onClick={() => { setShowSearch(!showSearch); if(showSearch) setSearchQuery(''); }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showSearch ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-indigo-50'}`}
                >
                  🔍
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-10 overflow-y-auto space-y-10 bg-slate-50/30 custom-scrollbar">
              {Object.keys(groupedMessages).length > 0 ? (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={`group-${date}`} className="space-y-6">
                    <div className="flex justify-center">
                      <div className="px-6 py-1.5 bg-slate-200/50 backdrop-blur-sm rounded-full text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {getDayLabel(date)}
                      </div>
                    </div>
                    {(msgs as ChatMessage[]).map((msg, idx) => {
                      const isMine = msg.senderId === myId;
                      const prevMsg = msgs[idx - 1] as ChatMessage | undefined;
                      const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
                      const timestamp = new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <MessageItem 
                          key={msg.id} 
                          msgId={msg.id}
                          msg={msg.text} 
                          isMine={isMine} 
                          showAvatar={showAvatar} 
                          timestamp={timestamp} 
                          read={msg.read} 
                          senderInitial={msg.senderName?.charAt(0) || 'U'}
                          attachments={msg.attachments}
                        />
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-200 h-full opacity-40">
                  <div className="text-8xl mb-6">📬</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.6em]">
                    {searchQuery ? 'ไม่พบข้อความที่ตรงกับการค้นหา' : 'เริ่มต้นการสนทนาใหม่'}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-8 bg-white border-t shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)] space-y-4">
              {/* Pending Attachments Preview */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                  {pendingAttachments.map((file, i) => (
                    <div key={i} className="relative group/att">
                      {file.type.startsWith('image/') ? (
                        <div className="w-16 h-16 rounded-xl border-2 border-indigo-100 overflow-hidden shadow-sm">
                          <img src={file.data} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border-2 border-slate-100 bg-slate-50 flex flex-col items-center justify-center p-1 text-center shadow-sm">
                          <span className="text-xl">📄</span>
                          <p className="text-[6px] font-black truncate w-full">{file.name}</p>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removePendingAttachment(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-rose-600 transition-colors"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 p-1 rounded-[2.5rem] bg-slate-50 border-2 border-slate-100 focus-within:border-indigo-600/30 focus-within:bg-white focus-within:shadow-2xl transition-all duration-300">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl hover:bg-indigo-50 transition-colors text-slate-400 hover:text-indigo-600"
                >
                  📎
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  className="flex-1 px-4 py-5 rounded-[2rem] bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-300"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim() && pendingAttachments.length === 0}
                  className="px-12 py-5 bg-[#1E1B4B] text-white rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:bg-black disabled:bg-slate-200 disabled:shadow-none transition-all flex items-center gap-3 active:scale-95"
                >
                  Send <span className="text-indigo-400">➤</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-20 bg-slate-50/50">
            <div className="text-[120px] mb-8">🛋️</div>
            <p className="font-black uppercase tracking-[0.8em] text-xs">Waiting for connection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(InternalChat);
