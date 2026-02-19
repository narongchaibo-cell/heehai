
import React, { useState, useEffect } from 'react';
import { Machine, MachineStatus, ChecklistSectionTemplate, ChecklistItemTemplate } from '../types';
import { DEFAULT_CHECKLIST } from '../constants';

interface MachineFormProps {
  machine?: Machine | null;
  onSave: (machine: Machine) => void;
  onClose: () => void;
}

const MachineForm: React.FC<MachineFormProps> = ({ machine, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Machine>>({
    id: '',
    name: '',
    model: '',
    location: '',
    status: MachineStatus.OPERATIONAL,
    efficiency: 100,
    lastInspection: new Date().toISOString().split('T')[0],
    checklistTemplate: DEFAULT_CHECKLIST
  });

  useEffect(() => {
    if (machine) {
      setFormData(machine);
    }
  }, [machine]);

  const addSection = () => {
    const newSection: ChecklistSectionTemplate = {
      id: `sec_${Date.now()}`,
      title: 'หมวดหมู่ใหม่',
      items: []
    };
    setFormData(prev => ({
      ...prev,
      checklistTemplate: [...(prev.checklistTemplate || []), newSection]
    }));
  };

  const removeSection = (secId: string) => {
    setFormData(prev => ({
      ...prev,
      checklistTemplate: prev.checklistTemplate?.filter(s => s.id !== secId)
    }));
  };

  const addItem = (secId: string) => {
    setFormData(prev => ({
      ...prev,
      checklistTemplate: prev.checklistTemplate?.map(s => s.id === secId ? {
        ...s,
        items: [...s.items, { id: `item_${Date.now()}`, label: 'รายการตรวจใหม่', type: 'boolean' }]
      } : s)
    }));
  };

  const updateItem = (secId: string, itemId: string, updates: Partial<ChecklistItemTemplate>) => {
    setFormData(prev => ({
      ...prev,
      checklistTemplate: prev.checklistTemplate?.map(s => s.id === secId ? {
        ...s,
        items: s.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
      } : s)
    }));
  };

  const removeItem = (secId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      checklistTemplate: prev.checklistTemplate?.map(s => s.id === secId ? {
        ...s,
        items: s.items.filter(i => i.id !== itemId)
      } : s)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return alert('กรุณาระบุรหัสและชื่อเครื่องจักร');
    onSave(formData as Machine);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-300 font-prompt">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center rounded-t-[2.5rem]">
          <div>
            <h3 className="text-2xl font-bold">{machine ? '⚙️ แก้ไขข้อมูลเครื่องจักร' : '🆕 เพิ่มเครื่องจักรใหม่'}</h3>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Machine & Checklist Configuration</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Basic Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b pb-2">ข้อมูลพื้นฐาน</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">รหัสเครื่องจักร</label>
                <input 
                  type="text" 
                  value={formData.id}
                  disabled={!!machine}
                  onChange={e => setFormData({...formData, id: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 font-bold"
                  placeholder="เช่น T1-MC01"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">ชื่อเครื่องจักร</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-bold"
                  placeholder="ระบุชื่อเรียก"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">รุ่น (Model)</label>
                  <input 
                    type="text" 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">สถานที่</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-100 outline-none font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checklist Builder */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
            <div className="flex justify-between items-center border-b pb-2">
               <h4 className="text-sm font-black text-blue-600 uppercase tracking-widest">ออกแบบรายการตรวจ</h4>
               <button type="button" onClick={addSection} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-all">+ เพิ่มหมวดหมู่</button>
            </div>
            
            <div className="space-y-6">
              {formData.checklistTemplate?.map((section) => (
                <div key={section.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <input 
                      className="bg-transparent font-bold text-slate-800 outline-none focus:border-b-2 border-blue-500 w-2/3"
                      value={section.title}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        checklistTemplate: prev.checklistTemplate?.map(s => s.id === section.id ? {...s, title: e.target.value} : s)
                      }))}
                    />
                    <button type="button" onClick={() => removeSection(section.id)} className="text-rose-400 hover:text-rose-600">🗑️</button>
                  </div>

                  <div className="space-y-3">
                    {section.items.map(item => (
                      <div key={item.id} className="flex gap-2 items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                        <input 
                          className="flex-1 text-xs font-medium outline-none"
                          value={item.label}
                          onChange={e => updateItem(section.id, item.id, { label: e.target.value })}
                        />
                        <select 
                          className="text-[10px] font-bold bg-slate-100 rounded p-1 outline-none"
                          value={item.type}
                          onChange={e => updateItem(section.id, item.id, { type: e.target.value as 'boolean' | 'numeric' })}
                        >
                          <option value="boolean">Yes/No</option>
                          <option value="numeric">ตัวเลข</option>
                        </select>
                        {item.type === 'numeric' && (
                          <input 
                            placeholder="หน่วย"
                            className="w-12 text-[10px] bg-slate-100 rounded p-1 outline-none"
                            value={item.unit || ''}
                            onChange={e => updateItem(section.id, item.id, { unit: e.target.value })}
                          />
                        )}
                        <button type="button" onClick={() => removeItem(section.id, item.id)} className="text-slate-300 hover:text-rose-500">✕</button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => addItem(section.id)}
                      className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all"
                    >
                      + เพิ่มรายการตรวจในหมวดนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 pt-8 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 transition-all"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-2xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3"
            >
              <span>💾 บันทึกข้อมูลและแม่แบบรายการตรวจ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MachineForm;
