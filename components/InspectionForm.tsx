
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Machine, MachineStatus, ChecklistSectionTemplate, ApprovalStatus, Personnel, PersonnelRole, User } from '../types';

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  initialValue?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ label, onSave, onClear, initialValue }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(!!initialValue);
  const lastSavedValue = useRef<string | undefined>(initialValue);

  // Fix: Import useCallback from React to resolve 'Cannot find name useCallback' error
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    const currentWidth = Math.floor(rect.width * dpr);
    const currentHeight = Math.floor(rect.height * dpr);

    if (canvas.width !== currentWidth || canvas.height !== currentHeight) {
        // Save current content if any
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

        canvas.width = currentWidth;
        canvas.height = currentHeight;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Restore content after resize
        if (lastSavedValue.current) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, rect.width, rect.height);
          };
          img.src = lastSavedValue.current;
        } else {
          ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
        }
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    const resizeObserver = new ResizeObserver(() => setupCanvas());
    const canvas = canvasRef.current;
    if (canvas) resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [setupCanvas]);

  // Handle Initial Value specifically to prevent clearing on parent re-renders
  useEffect(() => {
    if (initialValue && !hasSignature) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
        lastSavedValue.current = initialValue;
      };
      img.src = initialValue;
    }
  }, [initialValue, hasSignature]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const dataUrl = canvasRef.current!.toDataURL('image/png');
    lastSavedValue.current = dataUrl;
    onSave(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    lastSavedValue.current = undefined;
    onClear();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
        {hasSignature && (
          <button type="button" onClick={clear} className="text-[9px] text-rose-500 font-bold px-2 py-1 rounded hover:bg-rose-50 transition-colors">ล้าง</button>
        )}
      </div>
      <div className="bg-white border-2 border-slate-100 rounded-2xl h-36 overflow-hidden relative shadow-sm transition-all group focus-within:border-blue-500">
        <canvas 
          ref={canvasRef} 
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-full touch-none cursor-crosshair block"
          style={{ touchAction: 'none' }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 opacity-50">
            <span className="text-3xl">✍️</span>
            <span className="text-[9px] font-black uppercase tracking-widest mt-1">ลงชื่อที่นี่</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface InspectionFormProps {
  machines: Machine[];
  personnel: Personnel[];
  currentUser: User;
  onSubmit: (record: any) => void;
  editingRecord?: any;
  draft?: any;
  onDraftChange?: (draft: any) => void;
  onBack?: () => void;
}

const InspectionForm: React.FC<InspectionFormProps> = ({ 
  machines, personnel, currentUser, onSubmit, editingRecord, 
  draft, onDraftChange, onBack 
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState(draft?.machineId || editingRecord?.machineId || '');
  const [currentTemplate, setCurrentTemplate] = useState<ChecklistSectionTemplate[]>(draft?.sections || editingRecord?.sections || []);
  const [values, setValues] = useState<Record<string, any>>(draft?.values || editingRecord?.values || {});
  const [notes, setNotes] = useState(draft?.notes || editingRecord?.notes || '');
  
  const [operatorName, setOperatorName] = useState(draft?.operatorName || editingRecord?.operatorName || '');
  const [supervisorName, setSupervisorName] = useState(draft?.supervisorName || editingRecord?.supervisorName || '');
  const [engineerName, setEngineerName] = useState(draft?.engineerName || editingRecord?.engineerName || '');

  const [operatorSign, setOperatorSign] = useState<string>(draft?.operatorSignature || editingRecord?.operatorSignature || '');
  const [supervisorSign, setSupervisorSign] = useState<string>(draft?.supervisorSignature || editingRecord?.supervisorSignature || '');
  const [engineerSign, setEngineerSign] = useState<string>(draft?.engineerSignature || editingRecord?.engineerSignature || '');

  const prevMachineId = useRef(selectedMachineId);

  // Auto-sync local state to parent draft
  useEffect(() => {
    if (onDraftChange) {
      onDraftChange({
        machineId: selectedMachineId,
        sections: currentTemplate,
        values,
        notes,
        operatorName,
        supervisorName,
        engineerName,
        operatorSignature: operatorSign,
        supervisorSignature: supervisorSign,
        engineerSignature: engineerSign
      });
    }
  }, [
    selectedMachineId, currentTemplate, values, notes, 
    operatorName, supervisorName, engineerName, 
    operatorSign, supervisorSign, engineerSign, onDraftChange
  ]);

  // Effect: Pre-fill inspector names based on current user session
  useEffect(() => {
    if (!editingRecord && !draft && currentUser && currentUser.id !== 'ADMIN') {
      if (currentUser.personnelRole === PersonnelRole.OPERATOR) {
        setOperatorName(currentUser.name);
      } else if (currentUser.personnelRole === PersonnelRole.SUPERVISOR) {
        setSupervisorName(currentUser.name);
      } else if (currentUser.personnelRole === PersonnelRole.ENGINEER) {
        setEngineerName(currentUser.name);
      }
    }
  }, [currentUser, editingRecord, draft]);

  // Effect: Update template when machine is selected
  useEffect(() => {
    if (selectedMachineId !== prevMachineId.current) {
      if (selectedMachineId) {
        const machine = machines.find((m: Machine) => m.id === selectedMachineId);
        if (machine) {
          // หากไม่มี draft หรือ editingRecord ให้ดึง template ใหม่
          if (!editingRecord && (!draft || draft.machineId !== selectedMachineId)) {
            setCurrentTemplate(machine.checklistTemplate);
            setValues({});
          } else if (editingRecord || (draft && draft.machineId === selectedMachineId)) {
             // หากมีข้อมูลเดิมอยู่แล้ว แต่อาจจะยังไม่มี template (เช่นกรณีสลับหน้าไปมา)
             if (currentTemplate.length === 0) {
                setCurrentTemplate(machine.checklistTemplate);
             }
          }
        }
      } else {
        setCurrentTemplate([]);
      }
      prevMachineId.current = selectedMachineId;
    }
  }, [selectedMachineId, machines, editingRecord, draft, currentTemplate.length]);

  const handleStatusChange = (itemId: string, status: 'NORMAL' | 'WARNING' | 'CRITICAL') => {
    setValues(prev => ({
      ...prev,
      [itemId]: { 
        ...(prev[itemId] && typeof prev[itemId] === 'object' ? prev[itemId] : { note: '' }),
        status 
      }
    }));
  };

  const handleItemNoteChange = (itemId: string, note: string) => {
    setValues(prev => ({
      ...prev,
      [itemId]: { 
        ...(prev[itemId] && typeof prev[itemId] === 'object' ? prev[itemId] : { status: 'NORMAL' }),
        note 
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. ตรวจสอบการเลือกเครื่องจักร
    if (!selectedMachineId) {
      return alert('ข้อมูลยังไม่ครบ! กรุณาเลือกเครื่องจักรที่ต้องการตรวจสอบ');
    }
    
    // 2. ตรวจสอบการกรอก Checklist (ต้องเลือกสถานะทุกช่อง)
    const isChecklistComplete = currentTemplate.every(sec => 
      sec.items.every(item => {
        const val = values[item.id];
        if (item.type === 'boolean') {
          // ต้องมีสถานะระบุไว้
          return val && val.status;
        } else {
          // ต้องมีค่าตัวเลข (ไม่เป็นค่าว่าง)
          return val !== undefined && val !== '';
        }
      })
    );
    
    if (!isChecklistComplete) {
      return alert('ข้อมูลยังไม่ครบ! กรุณากรอกผลการตรวจสอบในรายการ Checklist ให้ครบทุกช่อง');
    }

    // 3. ตรวจสอบการระบุหมายเหตุสำหรับรายการที่ผิดปกติ (Warning/Critical)
    const missingItemNotes = currentTemplate.some(sec => 
      sec.items.some(item => {
        const val = values[item.id];
        if (val && typeof val === 'object' && ((val as any).status === 'WARNING' || (val as any).status === 'CRITICAL')) {
          return !(val as any).note || (val as any).note.trim().length === 0;
        }
        return false;
      })
    );
    
    if (missingItemNotes) {
      return alert('ข้อมูลยังไม่ครบ! สำหรับรายการที่ผิดปกติ กรุณาระบุหมายเหตุแจ้งอาการที่พบด้วยครับ');
    }

    // 4. ตรวจสอบการเลือกรายชื่อและลงลายเซ็น (อย่างน้อยต้องมี Operator)
    if (!operatorName || !operatorSign) {
       return alert('ข้อมูลยังไม่ครบ! กรุณาเลือกรายชื่อผู้ตรวจ (Operator) และลงลายเซ็นให้เรียบร้อย');
    }

    // คำนวณสถานะภาพรวม
    let overallStatus = MachineStatus.OPERATIONAL;
    Object.values(values).forEach(val => {
      if (val && typeof val === 'object') {
        const v = val as any;
        if (v.status === 'CRITICAL') overallStatus = MachineStatus.CRITICAL;
        else if (v.status === 'WARNING' && overallStatus !== MachineStatus.CRITICAL) overallStatus = MachineStatus.WARNING;
      }
    });

    const isFullySigned = operatorSign && (supervisorSign || engineerSign); // Allow either one if not all

    onSubmit({
      id: editingRecord?.id,
      machineId: selectedMachineId,
      values,
      notes,
      operatorName, supervisorName, engineerName,
      operatorSignature: operatorSign, supervisorSignature: supervisorSign, engineerSignature: engineerSign,
      date: editingRecord?.date || new Date().toISOString(),
      sections: currentTemplate,
      overallStatus,
      approvalStatus: (operatorSign && supervisorSign && engineerSign) ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 font-prompt animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#0F172A] p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          <div className="space-y-3 z-10">
            {onBack && (
              <button 
                type="button" 
                onClick={onBack}
                className="group flex items-center gap-2 text-blue-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest mb-2"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span> ย้อนกลับสู่หน้าหลัก
              </button>
            )}
            <h3 className="text-2xl font-black tracking-tight">บันทึกผลการตรวจสอบ</h3>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mt-1">Digital Inspection Log V2.3</p>
          </div>
          <div className="text-4xl hidden md:block opacity-20">📋</div>
          <div className="absolute top-8 right-8 text-white/5 text-8xl font-black select-none pointer-events-none">TMC</div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-3xl border border-slate-100">
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เครื่องจักร <span className="text-rose-500">*</span></label>
                <select 
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full px-6 py-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="">-- เลือกเครื่องจักร --</option>
                  {machines.map((m: Machine) => <option key={m.id} value={m.id}>{m.id} | {m.name}</option>)}
                </select>
             </div>
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">วันที่ตรวจ</label>
                <div className="w-full px-6 py-4 rounded-xl bg-slate-100 text-slate-500 font-bold border border-slate-200 shadow-inner">
                   📅 {new Date().toLocaleDateString('th-TH')}
                </div>
             </div>
          </div>

          {selectedMachineId && currentTemplate.length > 0 ? (
            <div className="space-y-12 animate-in fade-in duration-500">
              {currentTemplate.map((section, sIdx) => (
                <div key={section.id} className="space-y-6">
                  <h4 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md">{sIdx + 1}</span>
                    {section.title}
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {section.items.map(item => {
                      const val = values[item.id];
                      const currentVal = (typeof val === 'object' && val !== null) ? 
                        (val as { status: 'NORMAL' | 'WARNING' | 'CRITICAL', note: string }) : 
                        { status: val === true ? 'NORMAL' : val === false ? 'CRITICAL' : undefined, note: '' };

                      const isAbnormal = currentVal.status === 'WARNING' || currentVal.status === 'CRITICAL';

                      return (
                        <div key={item.id} className={`p-6 rounded-3xl border-2 transition-all space-y-4 shadow-sm ${
                          currentVal.status === 'NORMAL' ? 'border-emerald-500/20 bg-emerald-50/20' : 
                          currentVal.status === 'WARNING' ? 'border-amber-500/20 bg-amber-50/20' : 
                          currentVal.status === 'CRITICAL' ? 'border-rose-500/20 bg-rose-50/20' : 'border-slate-100 bg-white'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-700">{item.label}</span>
                            <div className="flex gap-2">
                              {item.type === 'boolean' ? (
                                <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner">
                                  <button 
                                    type="button" 
                                    onClick={() => handleStatusChange(item.id, 'NORMAL')} 
                                    className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${currentVal.status === 'NORMAL' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}
                                  >
                                    ปกติ
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleStatusChange(item.id, 'WARNING')} 
                                    className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${currentVal.status === 'WARNING' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}
                                  >
                                    ควรแก้ไข
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleStatusChange(item.id, 'CRITICAL')} 
                                    className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${currentVal.status === 'CRITICAL' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}
                                  >
                                    ชำรุด
                                  </button>
                                </div>
                              ) : (
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    value={typeof val === 'object' ? '' : (val || '')} 
                                    onChange={(e) => setValues({...values, [item.id]: e.target.value})} 
                                    className="w-32 px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-900 outline-none focus:border-blue-500 shadow-inner" 
                                    placeholder="0.0" 
                                  />
                                  <span className="absolute -top-4 right-0 text-[8px] font-black text-blue-500 uppercase tracking-widest">{item.unit}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isAbnormal && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                              <input 
                                type="text"
                                value={currentVal.note || ''}
                                onChange={(e) => handleItemNoteChange(item.id, e.target.value)}
                                placeholder="🔍 ระบุหมายเหตุ แจ้งอาการที่พบ..."
                                className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white/80 focus:border-indigo-400 outline-none font-medium text-xs shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="space-y-4 pt-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">สรุปหมายเหตุเพิ่มเติม (สำหรับทั้งใบตรวจ)</label>
                <textarea 
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-6 py-5 rounded-[2rem] border-2 border-slate-100 bg-white focus:border-blue-500 outline-none transition-all font-medium text-sm text-slate-700 shadow-sm"
                  placeholder="รายละเอียดสรุปภาพรวม หรือเรื่องอื่นๆ ที่ต้องการรายงานเพิ่มเติม..."
                ></textarea>
              </div>

              <div className="pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <select value={operatorName} onChange={(e) => setOperatorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold outline-none shadow-sm">
                    <option value="">-- ผู้ตรวจ (Operator) --</option>
                    {personnel.filter((p: Personnel) => p.role.toLowerCase().includes('operator')).map((p: Personnel) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <SignaturePad label="ลายเซ็นผู้ตรวจ" onSave={setOperatorSign} onClear={() => setOperatorSign('')} initialValue={operatorSign} />
                </div>
                <div className="space-y-4">
                  <select value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold outline-none shadow-sm">
                    <option value="">-- หัวหน้ากะ (Supervisor) --</option>
                    {personnel.filter((p: Personnel) => p.role.toLowerCase().includes('supervisor')).map((p: Personnel) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <SignaturePad label="ลายเซ็นหัวหน้า" onSave={setSupervisorSign} onClear={() => setSupervisorSign('')} initialValue={supervisorSign} />
                </div>
                <div className="space-y-4">
                  <select value={engineerName} onChange={(e) => setEngineerName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold outline-none shadow-sm">
                    <option value="">-- วิศวกร (Engineer) --</option>
                    {personnel.filter((p: Personnel) => p.role.toLowerCase().includes('engineer')).map((p: Personnel) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  <SignaturePad label="ลายเซ็นวิศวกร" onSave={setEngineerSign} onClear={() => setEngineerSign('')} initialValue={engineerSign} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-6">
                {onBack && (
                  <button 
                    type="button" 
                    onClick={onBack}
                    className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-2xl font-black text-lg hover:bg-slate-200 transition-all shadow-sm active:scale-95"
                  >
                    ยกเลิกและกลับสู่หน้าหลัก
                  </button>
                )}
                <button type="submit" className="flex-[2] py-6 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] transition-all">
                  บันทึกและอัปเดตสถานะเครื่องจักร
                </button>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50 space-y-4">
               <div className="text-6xl opacity-20">⚙️</div>
               <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">โปรดเลือกเครื่องจักรเพื่อเริ่มต้นการตรวจสอบ</p>
               {onBack && (
                  <button onClick={onBack} className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-md">
                    ← กลับสู่หน้าหลัก
                  </button>
               )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InspectionForm;
