
import React, { useState } from 'react';
import { analyzeMachineIssue } from '../services/geminiService';

const AIChatAssistant: React.FC = () => {
  const [query, setQuery] = useState('');
  const [model, setModel] = useState('General Machine');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const result = await analyzeMachineIssue(query, model);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <span className="bg-white/20 p-2 rounded-xl text-xl">🤖</span>
            AI ผู้ช่วยวิศวกร (Smart Diagnostic)
          </h2>
          <p className="mt-2 text-blue-100 max-w-xl">
            ระบุอาการผิดปกติหรือพารามิเตอร์ที่ผิดปกติของเครื่องจักร เพื่อให้ AI ช่วยวิเคราะห์สาเหตุและแนวทางการแก้ไขเบื้องต้น
          </p>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-10 text-[120px] select-none">⚙️</div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">อาการผิดปกติ</label>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="เช่น มีควันออกที่มอเตอร์, เสียงดังผิดปกติที่ลูกปืนฝั่งซ้าย..."
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อรุ่นเครื่องจักร</label>
            <input 
              type="text" 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        
        <button 
          onClick={handleAsk}
          disabled={loading || !query}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>วิเคราะห์ด้วย Gemini AI ✨</>
          )}
        </button>
      </div>

      {response && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border-l-4 border-l-blue-500 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 text-blue-600 mb-4 font-bold text-sm uppercase tracking-wider">
            <span>✨</span> ผลการวิเคราะห์จาก AI
          </div>
          <div className="prose prose-slate max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
              {response}
            </div>
          </div>
          <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 text-amber-800 text-sm italic">
            <span>⚠️</span>
            คำแนะนำนี้เป็นการวิเคราะห์เบื้องต้นโดย AI โปรดใช้วิจารณญาณและปฏิบัติตามมาตรฐานความปลอดภัยของบริษัทอย่างเคร่งครัด
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatAssistant;
