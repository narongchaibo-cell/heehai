import React, { useState } from 'react';
import { Personnel, PersonnelRole, UserRole } from '../types';

interface PersonnelManagementProps {
  personnel: Personnel[];
  departments: string[];
  userRole: UserRole;
  onAdd: (p: Personnel) => void;
  onUpdate: (p: Personnel) => void;
  onDelete: (id: string) => void;
  onAddDept: (dept: string) => void;
  onUpdateDept: (oldName: string, newName: string) => void;
  onDeleteDept: (dept: string) => void;
}

const PersonnelManagement: React.FC<PersonnelManagementProps> = ({ 
  personnel = [], departments = [], userRole, onAdd, onUpdate, onDelete,
  onAddDept, onUpdateDept, onDeleteDept
}) => {
  const isAdmin = userRole === UserRole.ADMIN;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Personnel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<PersonnelRole>(PersonnelRole.OPERATOR);
  const [department, setDepartment] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('นาย');

  // Department Management State
  const [isDeptManageOpen, setIsDeptManageOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const handleEdit = (p: Personnel) => {
    setEditingPerson(p);
    setName(p.name);
    setRole(p.role);
    setDepartment(p.info); // In this app, info is used as department
    setFirstName(p.firstName || '');
    setLastName(p.lastName || '');
    setTitle(p.title || 'นาย');
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingPerson(null);
    setName('');
    setRole(PersonnelRole.OPERATOR);
    setDepartment(departments[0] || 'Production');
    setFirstName('');
    setLastName('');
    setTitle('นาย');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return alert('กรุณาระบุชื่อและนามสกุล');

    const fullName = `${title}${firstName} ${lastName}`;
    const personData: Personnel = {
      id: editingPerson ? editingPerson.id : `P-${Date.now()}`,
      name: fullName,
      firstName,
      lastName,
      title,
      role,
      info: department, // storing department in info field
      deletedAt: undefined
    };

    if (editingPerson) {
      onUpdate(personData);
    } else {
      onAdd(personData);
    }
    setIsFormOpen(false);
  };

  const filteredPersonnel = (personnel || []).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.info.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 font-prompt animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">บุคลากร (Personnel)</h2>
          <p className="text-slate-400 text-sm">จัดการรายชื่อพนักงานและสิทธิ์การเข้าถึง</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
             <button 
               onClick={() => setIsDeptManageOpen(!isDeptManageOpen)}
               className="bg-white text-slate-600 border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all"
             >
               🏢 จัดการแผนก
             </button>
             <button 
               onClick={handleAddNew}
               className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
             >
               <span>＋</span> เพิ่มพนักงาน
             </button>
          </div>
        )}
      </div>

      {isDeptManageOpen && isAdmin && (
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 animate-in slide-in-from-top-2">
           <h4 className="font-black text-slate-700 mb-4">จัดการรายชื่อแผนก</h4>
           <div className="flex gap-2 mb-6">
             <input 
               type="text" 
               value={newDeptName}
               onChange={(e) => setNewDeptName(e.target.value)}
               placeholder="ชื่อแผนกใหม่..."
               className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500"
             />
             <button 
               onClick={() => {
                 if(newDeptName) {
                   onAddDept(newDeptName);
                   setNewDeptName('');
                 }
               }}
               className="bg-emerald-500 text-white px-6 rounded-xl font-bold hover:bg-emerald-600"
             >
               เพิ่ม
             </button>
           </div>
           <div className="flex flex-wrap gap-3">
             {departments.map(dept => (
               <div key={dept} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                 <span className="font-bold text-slate-600 text-sm">{dept}</span>
                 <button onClick={() => onDeleteDept(dept)} className="text-rose-400 hover:text-rose-600 text-xs">✕</button>
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อพนักงาน หรือแผนก..."
          className="w-full pl-10 pr-4 py-4 rounded-[2rem] border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPersonnel.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
             <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-md ${
                  p.role === PersonnelRole.ENGINEER ? 'bg-indigo-600' : 
                  p.role === PersonnelRole.SUPERVISOR ? 'bg-emerald-500' : 'bg-slate-400'
                }`}>
                  {p.name.charAt(0)}
                </div>
                <div className="text-right">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                      p.role === PersonnelRole.ENGINEER ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      p.role === PersonnelRole.SUPERVISOR ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                   }`}>
                     {p.role.split('/')[1] || p.role}
                   </span>
                </div>
             </div>
             
             <div className="space-y-1 mb-6">
               <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{p.name}</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.info}</p>
             </div>

             <div className="flex gap-2 relative z-10 pt-4 border-t border-slate-50">
                {isAdmin && (
                  <button 
                    onClick={() => handleEdit(p)}
                    className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-600 font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    แก้ไข
                  </button>
                )}
                {isAdmin && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(window.confirm(`⚠️ คำเตือนความปลอดภัย\n\nคุณต้องการลบ "${p.name}" ออกจากรายชื่อใช่หรือไม่?\n\n* ข้อมูลจะถูกย้ายไปที่ถังขยะและสามารถกู้คืนได้ภายในเวลาที่กำหนด`)) {
                        onDelete(p.id); 
                      }
                    }} 
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border-2 border-slate-100 bg-white text-slate-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 hover:shadow-lg active:scale-90 group/del"
                    title="ย้ายไปยังถังขยะ"
                  >
                    <span className="text-xl filter grayscale group-hover/del:grayscale-0 transition-all">🗑️</span>
                  </button>
                )}
                {!isAdmin && (
                  <button className="w-full py-3 rounded-xl bg-slate-50 text-slate-400 font-bold text-[10px] cursor-default">
                    View Only
                  </button>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#1E1B4B] p-8 text-white shrink-0 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">{editingPerson ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h3>
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">Personnel Management System</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">คำนำหน้า</label>
                    <select value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-slate-700">
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                 </div>
                 <div className="col-span-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ชื่อจริง</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-slate-700 focus:bg-white focus:border-indigo-500 transition-all" />
                 </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">นามสกุล</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-slate-700 focus:bg-white focus:border-indigo-500 transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ตำแหน่ง (Role)</label>
                <select value={role} onChange={e => setRole(e.target.value as PersonnelRole)} className="w-full px-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-slate-700">
                  {Object.values(PersonnelRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">แผนก (Department)</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full px-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 outline-none font-bold text-slate-700">
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">ยกเลิก</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all">บันทึกข้อมูล</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelManagement;