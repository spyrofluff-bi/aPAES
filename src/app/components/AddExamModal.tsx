"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";

interface AddExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExam: (meta: any, questions: any) => void;
  dark: boolean;
}

export default function AddExamModal({ isOpen, onClose, onSaveExam, dark }: AddExamModalProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.preguntas || !Array.isArray(parsed.preguntas)) throw new Error("El JSON debe contener un arreglo 'preguntas'");
      const formatted = parsed.preguntas.map((p: any) => ({
        id: p.id,
        text: p.enunciado || "Sin enunciado",
        options: Object.values(p.opciones || {}),
        correctAnswer: p.respuesta_correcta,
        explanation: p.explicacion,
      }));
      setError("");
      onSaveExam(parsed.metadata || {}, formatted);
      setJsonInput("");
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      setError("Error parseando el JSON: " + e.message);
    }
  };

  const loadExample = () => setJsonInput(JSON.stringify({
    metadata: { año: 2027, asignatura: "Competencia Matemática 1 (M1)", nivel_de_dificultad: "Regular" },
    preguntas: [{
      id: 1,
      enunciado: "En una tienda, un artículo vale $120.000. El precio sube 15% y luego baja 10%. ¿Cuál es el precio final?",
      opciones: { A: "$124.200", B: "$126.000", C: "$132.000", D: "$138.000" },
      respuesta_correcta: "A",
      explicacion: "120.000 × 1.15 = 138.000; 138.000 × 0.90 = 124.200.",
    }],
  }, null, 2));

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl border-[4px] rounded-3xl p-8 flex flex-col gap-4 animate-in zoom-in-95 duration-200 ${dark ? "bg-[#12112a] border-white/10" : "bg-white border-black"}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 ${dark ? "text-white hover:bg-white/10" : "text-black"}`}>
          <X size={24} />
        </button>

        <h2 className="text-[1.8rem] font-black uppercase tracking-tighter text-[#6c40d6]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>
          Importar Ensayo (JSON)
        </h2>
        
        <p className={`text-sm font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Pega el contenido JSON del ensayo para agregarlo a tu biblioteca.
        </p>

        <div className="relative">
          <textarea
            className={`w-full h-80 p-5 font-mono text-[13px] border-[3px] rounded-xl shadow-inner focus:outline-none focus:border-[#7141d9] focus:ring-2 focus:ring-[#7141d9]/30 resize-none
              ${dark ? "bg-white/5 border-white/10 text-slate-100" : "bg-[#f4f2f9] border-black text-black"}`}
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder={'{\n  "metadata": { "año": 2027, "asignatura": "Matemática 1" },\n  "preguntas": [\n    {\n      "id": 1,\n      "enunciado": "...",\n      "opciones": { "A": "...", "B": "..." },\n      "respuesta_correcta": "A",\n      "explicacion": "..."\n    }\n  ]\n}'}
          />

          <button
            onClick={loadExample}
            className={`absolute top-4 right-6 text-[10px] font-black uppercase px-3 py-1 rounded-lg border-2 transition-all active:translate-y-0.5
              ${dark ? "bg-white/10 border-white/20 text-slate-200 hover:bg-white/20" : "bg-[#e2deef] border-black hover:bg-[#d0c6eb]"}`}
          >
            Cargar Ejemplo
          </button>
        </div>

        {error && <div className="text-red-400 font-extrabold border-2 border-red-400 bg-red-500/10 p-3 rounded-lg text-xs">{error}</div>}

        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex items-center justify-center gap-2 px-8 py-4 text-xl font-black border-[4px] border-black rounded-2xl transition-all active:translate-y-1 active:shadow-none w-full mt-2
            ${saved ? "bg-emerald-500 text-white border-emerald-700" : "bg-[#6c40d6] hover:bg-[#5b3eb8] text-white shadow-[4px_4px_0_#000]"}`}
        >
          {saved ? "¡GUARDADO!" : <><Plus size={24} strokeWidth={3} /> GUARDAR EN MIS ENSAYOS</>}
        </button>
      </div>
    </div>
  );
}
