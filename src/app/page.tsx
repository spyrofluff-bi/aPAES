"use client";

import { useState, useEffect, useRef } from "react";
import ExamPlayer from "./components/ExamPlayer";
import {
  Menu, Home as HomeIcon, PenBox, Settings, Plus, Play,
  Moon, Sun, BarChart2, Trash2, FolderOpen, ChevronDown, ChevronUp, ShieldAlert
} from "lucide-react";
import AdminTab from "./components/AdminTab";
import AddExamModal from "./components/AddExamModal";
import SyncIndicator from "../components/SyncIndicator";
import { useOfflineSync } from "../lib/useOfflineSync";

// ────────────────────────────────────────────────────────────────────────────
// Types & constants
// ────────────────────────────────────────────────────────────────────────────
const PRUEBAS_DISPONIBLES = [
  { id: "m1", label: "Matemática 1" },
  { id: "m2", label: "Matemática 2" },
  { id: "cl", label: "Comprensión Lectora" },
  { id: "hist", label: "Historia y C. Sociales" },
  { id: "cien", label: "Ciencias" },
];

type Goals = {
  puntajeDeseado: number;
  ensayosSemanales: number;
  pruebasSeleccionadas: string[];
  puntajesPorPrueba: Record<string, number>;
};

type ExamResult = {
  id: number;
  examId: number;
  examLabel: string;
  asignatura: string;
  año: number | string;
  score: number;
  answered: number;
  total: number;
  elapsedSecs: number;
  group: string;
  date: string;
};

type Section = { id: string; name: string; };

const DEFAULT_GOALS: Goals = {
  puntajeDeseado: 850,
  ensayosSemanales: 3,
  pruebasSeleccionadas: ["m1", "cl"],
  puntajesPorPrueba: { m1: 750, m2: 700, cl: 800, hist: 650, cien: 680 },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// ────────────────────────────────────────────────────────────────────────────
// root
// ────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState("Practicar");
  const [activeExam, setActiveExam] = useState<{ questions: any[]; meta: any } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [savedExams, setSavedExams] = useState<any[]>([]);
  const [globalExams, setGlobalExams] = useState<any[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [sections, setSections] = useState<Section[]>([{ id: "default", name: "Sin categoría" }]);
  const [dark, setDark] = useState(false);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { sync: syncToServer, loadData, syncStatus, isOnline } = useOfflineSync();

  useEffect(() => setMounted(true), []);

  // Build the full data snapshot and sync it
  const sync = (patch: any) => {
    const fullData = { savedExams, results, goals, sections, dark, ...patch };
    syncToServer(fullData);
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    sync({ dark: next });
  };

  // Cargar datos del server y globales
  useEffect(() => {
    loadData()
      .then(data => {
        if (!data) return;
        const d = data as any;
        if (d.savedExams) setSavedExams(d.savedExams);
        if (d.results) setResults(d.results);
        if (d.goals) setGoals(d.goals);
        if (d.sections) setSections(d.sections);
        if (d.dark !== undefined) setDark(d.dark);
      })
      .catch(console.error);

    fetch('/api/global-exams')
      .then(r => r.ok ? r.json() : [])
      .then(data => setGlobalExams(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : {})
      .then((data: { is_admin?: boolean; has_passkey?: boolean }) => {
        setIsAdmin(!!data.is_admin);
        setHasPasskey(!!data.has_passkey);
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case "i": setActiveTab("Inicio"); break;
        case "p": setActiveTab("Practicar"); break;
        case "g": setActiveTab("Progreso"); break;
        case "m": setIsMenuOpen(o => !o); break;
        case "d": toggleDark(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dark]);

  const allExams = [...globalExams, ...savedExams];

  const saveExam = (metadata: any, data: any) => {
    const updated = [...savedExams, { metadata, data, id: Date.now(), sectionId: "default" }];
    setSavedExams(updated);
    sync({ savedExams: updated });
    setActiveTab("Practicar");
  };

  const saveResult = (r: ExamResult) => {
    const updated = [...results, r];
    setResults(updated);
    sync({ results: updated });
  };

  const deleteResult = (id: number) => {
    const updated = results.filter(r => r.id !== id);
    setResults(updated);
    sync({ results: updated });
  };

  const updateGoals = (g: Goals) => {
    setGoals(g);
    sync({ goals: g });
  };

  const addSection = (name: string) => {
    const s: Section = { id: `sec_${Date.now()}`, name };
    const updated = [...sections, s];
    setSections(updated);
    sync({ sections: updated });
  };

  const deleteSection = (id: string) => {
    const updatedExams = savedExams.map(e => e.sectionId === id ? { ...e, sectionId: "default" } : e);
    const updatedSections = sections.filter(s => s.id !== id);
    setSavedExams(updatedExams);
    setSections(updatedSections);
    sync({ savedExams: updatedExams, sections: updatedSections });
  };

  const renameSection = (id: string, name: string) => {
    const updated = sections.map(s => s.id === id ? { ...s, name } : s);
    setSections(updated);
    sync({ sections: updated });
  };

  const moveExam = (examId: number, sectionId: string) => {
    const updated = savedExams.map(e => e.id === examId ? { ...e, sectionId } : e);
    setSavedExams(updated);
    sync({ savedExams: updated });
  };

  const deleteExam = (examId: number) => {
    const updated = savedExams.filter(e => e.id !== examId);
    setSavedExams(updated);
    sync({ savedExams: updated });
  };

  const updateExam = (examId: number, patch: Record<string, any>) => {
    const updated = savedExams.map(e => e.id === examId ? { ...e, ...patch } : e);
    setSavedExams(updated);
    sync({ savedExams: updated });
  };

  useEffect(() => {
    if (activeExam) {
      document.body.setAttribute("data-exam-active", "true");
    } else {
      document.body.removeAttribute("data-exam-active");
    }
    return () => document.body.removeAttribute("data-exam-active");
  }, [activeExam]);

  if (activeExam) {
    return (
      <ExamPlayer
        questions={activeExam.questions}
        examMeta={activeExam.meta}
        onExit={() => setActiveExam(null)}
        onSaveResult={r => { saveResult(r); }}
      />
    );
  }

  const tabs = [
    { id: "Inicio", icon: HomeIcon },
    { id: "Practicar", icon: PenBox },
    { id: "Progreso", icon: BarChart2 },
  ];

  if (isAdmin) {
    tabs.push({ id: "Administración", icon: ShieldAlert });
  }

  // theme helpers
  const bg = dark ? "bg-[var(--palette-dark-page)]" : "bg-[var(--palette-page)]";
  const navBg = "bg-[var(--palette-nav)]";
  const tx = dark ? "text-slate-100" : "text-black";
  const border = dark ? "border-white/10" : "border-black";

  if (!mounted) return null;

  if (isMobile) {
    return (
      <div className={`min-h-screen flex flex-col font-sans ${bg} ${tx} transition-colors duration-300`}>
        {/* Header Movil */}
        <header className={`h-16 shrink-0 ${navBg} border-b-[3px] ${border} flex items-center justify-between px-5 z-20`}>
          <div className="flex items-center gap-2">
            <img fetchPriority="high" src="/apaes.svg" alt="logo" className="w-8 h-8" />
            <span className="text-xl text-white font-bowlby tracking-wider" style={{ WebkitTextStroke: "1px black" }}>aPAES</span>
          </div>
          <div className="flex items-center gap-2">
            <SyncIndicator status={syncStatus} isOnline={isOnline} dark={dark} />
            <button aria-label="Modo oscuro" onClick={toggleDark} className="text-white p-2 rounded-lg bg-white/10">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto pb-24 p-5">
          <div className="max-w-xl mx-auto w-full">
            {activeTab === "Inicio" && <InicioTab goals={goals} results={results} dark={dark} isMobile={true} />}
            {activeTab === "Practicar" && <PracticarTab savedExams={allExams} sections={sections} onStartExam={e => setActiveExam(e)} onAddClick={() => setIsAddModalOpen(true)} onAddSection={addSection} onDeleteSection={deleteSection} onRenameSection={renameSection} onMoveExam={moveExam} onDeleteExam={deleteExam} onUpdateExam={updateExam} dark={dark} isMobile={true} />}
            {activeTab === "Progreso" && <ProgresoTab goals={goals} results={results} onUpdateGoals={updateGoals} onDeleteResult={deleteResult} dark={dark} isMobile={true} />}
            {activeTab === "Administración" && isAdmin && <AdminTab dark={dark} isMobile={true} hasPasskey={hasPasskey} />}
          </div>
        </main>

        {/* Bottom Nav */}
        <nav className={`fixed bottom-0 left-0 right-0 h-20 ${navBg} border-t-[4px] ${border} flex items-center justify-around px-2 z-20 pb-safe`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 transition-all ${active ? "text-white scale-110" : "text-white/50"}`}
              >
                <div className={`p-2 rounded-xl transition-all ${active ? "bg-[var(--palette-accent)] border-[2px] border-black shadow-[2px_2px_0_#000]" : ""}`}>
                  <Icon size={24} strokeWidth={active ? 3 : 2} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">{tab.id}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans ${bg} ${tx} transition-colors duration-300`}>
      {/* ── Sidebar ── */}
      <nav className={`${isMenuOpen ? "w-64" : "w-20"} transition-all duration-300 ${navBg} border-r-[4px] ${border} flex flex-col items-center py-6 shrink-0 z-10`}>
        <div
          className={`w-full flex ${isMenuOpen ? "justify-end px-4" : "justify-center"} mb-4 text-white hover:text-purple-300 cursor-pointer transition-colors`}
          onClick={() => setIsMenuOpen(o => !o)}
        >
          <Menu size={36} strokeWidth={2.5} />
        </div>

        {/* Logo */}
        <div className={`flex flex-col items-center transition-all duration-300 ${isMenuOpen ? "opacity-100 mb-16" : "opacity-0 h-0 overflow-hidden mb-0 pointer-events-none"}`}>
          <div className="w-[400px] h-[380px] mb-3">
            <img fetchPriority="high" src="/apaes.svg" alt="aPAES logo" className="w-full h-full drop-shadow-md object-contain" />
          </div>
          <span className="text-[2.2rem] text-white tracking-widest text-center font-bowlby" style={{ WebkitTextStroke: "1.5px black", textShadow: "2px 2px 0 #000" }}>
            aPAES
          </span>
        </div>
        {/* Nav */}
        <div className="w-full px-3 flex flex-col gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.id}
                className={`w-full py-2.5 px-3 flex items-center ${isMenuOpen ? "justify-start" : "justify-center"} gap-3 text-lg font-extrabold border-[3px] border-black rounded transition-all text-white
                  ${activeTab === tab.id ? "bg-[var(--palette-accent)] translate-y-0.5" : "bg-[var(--palette-accent)] hover:-translate-y-0.5 hover:bg-[var(--palette-accent)]"}`}
              >
                <Icon size={22} strokeWidth={2.5} className="shrink-0" />
                {isMenuOpen && <span>{tab.id}</span>}
              </button>
            );
          })}
        </div>

        {/* Dark mode */}
        <div className="mt-auto w-full px-3 pt-6 flex flex-col gap-2">
          {isMenuOpen && (
            <div className="flex justify-center">
              <SyncIndicator status={syncStatus} isOnline={isOnline} dark={dark} />
            </div>
          )}
          <button
            onClick={toggleDark}
            className={`w-full py-2 px-3 flex items-center ${isMenuOpen ? "justify-start" : "justify-center"} gap-3 text-sm font-bold border-[2px] border-white/20 rounded-lg transition-all text-white hover:bg-white/10`}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
            {isMenuOpen && <span>{dark ? "Modo Claro" : "Modo Oscuro"}</span>}
          </button>
        </div>
      </nav>

      {/* ── tab completo ── */}
      <main className="flex-1 p-10 overflow-y-auto outline-none">
        <div className="max-w-5xl mx-auto w-full">
          {activeTab === "Inicio" && <InicioTab goals={goals} results={results} dark={dark} isMobile={false} />}
          {activeTab === "Practicar" && <PracticarTab savedExams={allExams} sections={sections} onStartExam={e => setActiveExam(e)} onAddClick={() => setIsAddModalOpen(true)} onAddSection={addSection} onDeleteSection={deleteSection} onRenameSection={renameSection} onMoveExam={moveExam} onDeleteExam={deleteExam} onUpdateExam={updateExam} dark={dark} isMobile={false} />}
          {activeTab === "Progreso" && <ProgresoTab goals={goals} results={results} onUpdateGoals={updateGoals} onDeleteResult={deleteResult} dark={dark} isMobile={false} />}
          {activeTab === "Administración" && isAdmin && <AdminTab dark={dark} isMobile={false} hasPasskey={hasPasskey} />}
        </div>
      </main>

      <AddExamModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSaveExam={saveExam} 
        dark={dark} 
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// khe
// ────────────────────────────────────────────────────────────────────────────
function Card({ children, dark, className = "" }: { children: React.ReactNode; dark: boolean; className?: string }) {
  return (
    <div className={`border-[4px] rounded-2xl p-6 ${dark ? "bg-[#12112a] border-white/10" : "bg-white border-black"} ${className}`}>
      {children}
    </div>
  );
}

function SectionCard({ title, children, dark }: { title: string; children?: React.ReactNode; dark: boolean }) {
  return (
    <div className={`min-h-[140px] rounded-xl p-4 border-[3px] ${dark ? "bg-[#2a1a5e] border-white/10" : "bg-[#6136af] border-black"}`}>
      <h2 className="text-[1.1rem] text-white font-extrabold tracking-tight mb-3 uppercase" style={{ WebkitTextStroke: "1px rgba(0,0,0,0.4)", textShadow: "1.5px 1.5px 0 rgba(0,0,0,0.3)" }}>{title}</h2>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// panel inicio
// ────────────────────────────────────────────────────────────────────────────
function InicioTab({ goals, results, dark, isMobile }: { goals: Goals; results: ExamResult[]; dark: boolean; isMobile: boolean }) {
  const tx = dark ? "text-slate-100" : "text-black";
  const sub = dark ? "text-slate-400" : "text-slate-600";
  const history = results.slice(-8);
  const maxScore = Math.max(...history.map(r => r.score), goals.puntajeDeseado, 100);

  return (
    <div className="w-full flex flex-col gap-6 md:gap-8">
      <Card dark={dark}>
        <h2 className={`text-[1.3rem] md:text-[1.6rem] font-black mb-1 tracking-tight flex flex-col md:flex-row md:items-center justify-between gap-2 ${tx}`}>
          <span>Historial de Puntaje</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 self-start ${dark ? "bg-white/10 border-white/20" : "bg-[#e2deef] border-black"}`}>
            Meta: {goals.puntajeDeseado} pts
          </span>
        </h2>
        <p className={`text-xs mb-6 ${sub}`}>Últimos {history.length || 0} ensayos registrados</p>


        {history.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-40 gap-2 ${sub}`}>
            <BarChart2 size={36} className="opacity-30" />
            <p className="text-sm font-semibold">Aún no hay resultados guardados.</p>
          </div>
        ) : (
          <div className="flex items-end justify-start h-[200px] w-full px-2 gap-3 overflow-x-auto pb-2">
            {/* Meta line */}
            <div className="relative flex items-end h-full gap-3 w-full">
              {/* dashed goal line */}
              <div
                className="absolute left-0 right-0 border-t-[2px] border-dashed border-emerald-400 z-20 pointer-events-none"
                style={{ bottom: `${(goals.puntajeDeseado / maxScore) * 100}%` }}
                title={`Meta: ${goals.puntajeDeseado}`}
              />
              {history.map((r, i) => {
                const h = Math.max(6, (r.score / maxScore) * 100);
                return (
                  <div key={r.id} className="flex flex-col items-center flex-1 min-w-[44px] h-full justify-end group relative">
                    {/* tooltip */}
                    <div className={`absolute bottom-full mb-1 text-[11px] font-black px-2 py-0.5 rounded border-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 ${dark ? "bg-[#1a0f38] border-white/20 text-white" : "bg-white border-black text-black"}`}>
                      {r.score} pts<br /><span className="font-normal opacity-60">{r.asignatura?.substring(0, 10)}</span>
                    </div>
                    <div
                      className={`w-full rounded-t-lg border-[3px] transition-all ${dark ? "border-indigo-400/60 bg-indigo-500 hover:bg-indigo-400" : "border-black bg-[#6e46cb] hover:bg-[#865eea]"}`}
                      style={{ height: `${h}%` }}
                    />
                    <span className={`font-bold text-[9px] mt-1.5 text-center leading-tight ${sub}`}>{r.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Stats row */}
      {results.length > 0 && (
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-4`}>
          {[
            { label: "Mejor puntaje", value: Math.max(...results.map(r => r.score)), unit: "pts" },
            { label: "Promedio", value: Math.round(results.reduce((s, r) => s + r.score, 0) / results.length), unit: "pts" },
            { label: "Ensayos realizados", value: results.length, unit: "" },
          ].map(s => (
            <Card key={s.label} dark={dark} className={`${isMobile ? "p-4" : "p-6"} text-center`}>
              <p className={`text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2 ${dark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
              <p className={`${isMobile ? "text-2xl" : "text-4xl"} font-black ${dark ? "text-indigo-300" : "text-[var(--palette-accent)]"}`}>{s.value}<span className="text-lg ml-1">{s.unit}</span></p>
            </Card>
          ))}
        </div>
      )}

      {/* Per-prueba trabajo  */}
      <Card dark={dark}>
        <h2 className={`text-[1.2rem] md:text-[1.5rem] font-black tracking-tight mb-5 ${dark ? "text-slate-100" : "text-black"}`}>Metas por prueba</h2>
        <div className="flex flex-wrap gap-3 md:gap-4">

          {goals.pruebasSeleccionadas.length === 0 && (
            <p className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>Configura tus pruebas en la sección <strong>Progreso</strong>.</p>
          )}
          {goals.pruebasSeleccionadas.map(pid => {
            const prueba = PRUEBAS_DISPONIBLES.find(p => p.id === pid);
            if (!prueba) return null;
            const meta = goals.puntajesPorPrueba[pid] ?? goals.puntajeDeseado;
            const relevant = results.filter(r => r.asignatura?.toLowerCase().includes(prueba.label.split(" ")[0].toLowerCase()));
            const last = relevant[relevant.length - 1];
            const diff = last ? last.score - meta : null;
            return (
              <div key={pid} className={`flex flex-col items-center gap-2 p-4 rounded-xl border-[3px] min-w-[110px] flex-1 ${dark ? "border-white/10 bg-white/5" : "border-black bg-[#f4f2f9]"}`}>
                <span className={`font-black text-xs text-center uppercase tracking-tight ${dark ? "text-slate-300" : "text-slate-600"}`}>{prueba.label}</span>
                <div className={`w-7 h-28 rounded-full relative overflow-hidden border-[3px] ${dark ? "border-white/20 bg-white/5" : "border-black bg-white"}`}>
                  <div className={`absolute bottom-0 w-full ${dark ? "bg-indigo-400" : "bg-[#6e46cb]"}`} style={{ height: `${Math.min(100, (meta / 1000) * 100)}%` }} />
                </div>
                <span className={`font-black text-base ${dark ? "text-slate-100" : "text-black"}`}>{meta} pts</span>
                {diff !== null && (
                  <span className={`text-[10px] font-bold ${diff >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {diff >= 0 ? "+" : ""}{diff} vs meta
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PracticarTab — secciones con drag n drop
// ────────────────────────────────────────────────────────────────────────────
function PracticarTab({ savedExams, sections, onStartExam, onAddClick, onAddSection, onDeleteSection, onRenameSection, onMoveExam, onDeleteExam, onUpdateExam, dark, isMobile }: {
  savedExams: any[];
  sections: Section[];
  onStartExam: (e: { questions: any[]; meta: any }) => void;
  onAddClick: () => void;
  onAddSection: (name: string) => void;
  onDeleteSection: (id: string) => void;
  onRenameSection: (id: string, name: string) => void;
  onMoveExam: (examId: number, sectionId: string) => void;
  onDeleteExam: (examId: number) => void;
  onUpdateExam: (examId: number, patch: Record<string, any>) => void;
  dark: boolean;
  isMobile: boolean;
}) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");

  // Context menu
  type CtxMenu = { examId: number; x: number; y: number };
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didMove = useRef(false);

  const openCtxMenu = (examId: number, x: number, y: number) => {
    setCtxMenu({ examId, x, y });
  };
  const closeCtxMenu = () => setCtxMenu(null);

  const STATUSES = [
    { key: "none", label: "Sin estado", color: "bg-gray-400", icon: "○" },
    { key: "pending", label: "Pendiente", color: "bg-amber-400", icon: "◑" },
    { key: "completed", label: "Completado", color: "bg-emerald-500", icon: "●" },
  ] as const;
  type StatusKey = typeof STATUSES[number]["key"];

  const cycleStatus = (exam: any) => {
    const cur: StatusKey = exam.status || "none";
    const idx = STATUSES.findIndex(s => s.key === cur);
    const next = STATUSES[(idx + 1) % STATUSES.length].key;
    onUpdateExam(exam.id, { status: next });
    closeCtxMenu();
  };

  const examsBySection = (sid: string) => savedExams.filter(e => (e.sectionId || "default") === sid);

  const handleAddSection = () => {
    const name = newSectionName.trim();
    if (!name) return;
    onAddSection(name);
    setNewSectionName("");
    setShowAddSection(false);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {sections.map(section => {
        const exams = examsBySection(section.id);
        const isOver = dragOverSection === section.id;
        return (
          <div
            key={section.id}
            onDragOver={e => { e.preventDefault(); setDragOverSection(section.id); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverSection(null); }}
            onDrop={e => {
              e.preventDefault();
              if (draggingId !== null) onMoveExam(draggingId, section.id);
              setDraggingId(null);
              setDragOverSection(null);
            }}
            className={`rounded-2xl border-[3px] transition-all duration-200 ${dark
              ? isOver ? "border-indigo-400 bg-[#1e1245]" : "bg-[#2a1a5e] border-white/10"
              : isOver ? "border-[var(--palette-accent)] bg-[#ede8f8]" : "bg-[#6136af] border-black"
              }`}
          >
            {/* Section header */}
            <div className={`flex items-center justify-between px-5 py-3 border-b-[2px] ${dark ? "border-white/10" : "border-black/20"}`}>
              {editingSectionId === section.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    className={`text-sm font-bold px-2 py-1 rounded border-2 focus:outline-none flex-1 max-w-[220px] ${dark ? "bg-white/10 border-white/20 text-white" : "bg-white border-black text-black"}`}
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { onRenameSection(section.id, editingName); setEditingSectionId(null); }
                      if (e.key === "Escape") setEditingSectionId(null);
                    }}
                    autoFocus
                  />
<button aria-label="Guardar nombre" onClick={() => { onRenameSection(section.id, editingName); setEditingSectionId(null); }} className="text-emerald-400 font-black text-sm px-2 py-1 hover:bg-emerald-400/10 rounded">Guardar</button>
      <button aria-label="Cancelar edición" onClick={() => setEditingSectionId(null)} className="text-rose-400 font-black text-sm px-2 py-1 hover:bg-rose-400/10 rounded">Cancelar</button>
                </div>
              ) : (
                <h2
                  className="text-[1.1rem] text-white font-extrabold tracking-tight uppercase cursor-pointer select-none"
                  style={{ WebkitTextStroke: "1px rgba(0,0,0,0.4)", textShadow: "1.5px 1.5px 0 rgba(0,0,0,0.3)" }}
                  onDoubleClick={() => { setEditingSectionId(section.id); setEditingName(section.name); }}
                  title="Doble clic para renombrar"
                >
                  {section.name}
                  <span className="ml-2 text-[10px] font-normal opacity-60 normal-case" style={{ WebkitTextStroke: "0px" }}>({exams.length} ensayo{exams.length !== 1 ? "s" : ""})</span>
                </h2>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingSectionId(section.id); setEditingName(section.name); }}
                  className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded hover:bg-white/10"
                  title="Renombrar sección"
                >
                  <PenBox size={13} />
                </button>
                {section.id !== "default" && (
                  <button
                    onClick={() => onDeleteSection(section.id)}
                    className="text-rose-400/60 hover:text-rose-400 transition-colors p-1.5 rounded hover:bg-rose-400/10"
                    title="Eliminar sección"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Exam cards grid */}
            <div className={`p-4 grid ${isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"} gap-4`}>
              {exams.map(exam => {
                const status = STATUSES.find(s => s.key === (exam.status || "none")) ?? STATUSES[0];
                const displayLabel = exam.customLabel || exam.metadata?.asignatura || "Ensayo";
                return (
                  <div
                    key={exam.id}
                    draggable
                    onDragStart={e => { setDraggingId(exam.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDraggingId(null); setDragOverSection(null); }}
                    onClick={() => { if (draggingId === null && ctxMenu === null) onStartExam({ questions: exam.data, meta: { ...exam.metadata, id: exam.id } }); }}
                    onContextMenu={e => { e.preventDefault(); openCtxMenu(exam.id, e.clientX, e.clientY); }}
                    onPointerDown={e => {
                      if (e.button === 2) return;
                      didMove.current = false;
                      longPressRef.current = setTimeout(() => {
                        if (!didMove.current) openCtxMenu(exam.id, e.clientX, e.clientY);
                      }, 500);
                    }}
                    onPointerMove={() => { didMove.current = true; if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                    onPointerUp={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                    onPointerCancel={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                    className={`group relative aspect-[3/4] bg-[#e3f4e3] border-[3px] border-black rounded-lg p-3 flex flex-col cursor-grab active:cursor-grabbing transition-all hover:-translate-y-1 overflow-hidden select-none ${draggingId === exam.id ? "opacity-30 scale-95" : ""}`}
                  >
                    {/* Status badge */}
                    {exam.status && exam.status !== "none" && (
                      <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-black ${status.color} z-10`} title={status.label} />
                    )}
                    {exam.isGlobal && (
                      <div className="absolute top-1.5 right-1.5 bg-[var(--palette-accent)] text-white text-[8px] font-black px-1.5 rounded border border-black z-10">GLOBAL</div>
                    )}
                    <div className="flex justify-between items-center bg-[var(--palette-success)] text-white px-2 py-0.5 rounded text-[10px] font-bold mb-2 border-2 border-black">
                      <span>{exam.metadata?.año || "2024"}</span>
                      <span className="bg-white text-black px-1 rounded-sm text-[8px] uppercase">{exam.metadata?.asignatura?.substring(0, 3) || "GEN"}</span>
                    </div>
                    {editingLabelId === exam.id ? (
                      <input
                        className="text-[10px] font-black text-center border-y-2 border-black py-1 my-1 uppercase bg-white text-black w-full focus:outline-none"
                        value={editingLabel}
                        onChange={e => setEditingLabel(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") { onUpdateExam(exam.id, { customLabel: editingLabel }); setEditingLabelId(null); }
                          if (e.key === "Escape") setEditingLabelId(null);
                        }}
                        onBlur={() => { onUpdateExam(exam.id, { customLabel: editingLabel }); setEditingLabelId(null); }}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <div className="text-[11px] font-black text-center border-y-2 border-black py-2 my-1 leading-tight uppercase">
                        {displayLabel}
                      </div>
                    )}
                    <div className="flex-1 mt-2 flex justify-center items-center">
                      <Play size={28} className="opacity-20 group-hover:opacity-100 transition-opacity text-[var(--palette-success)] fill-[var(--palette-success)]" stroke="black" strokeWidth={3} />
                    </div>
                    <p className="text-center mt-auto text-[9px] font-bold pt-2 border-t-2 border-dashed border-black">{exam.data.length} preguntas</p>
                  </div>
                );
              })}

              {/* Add exam button — only in default section */}
              {section.id === "default" && (
                <div
                  onClick={onAddClick}
                  className={`aspect-[3/4] border-[3px] border-dashed rounded-lg flex flex-col justify-center items-center cursor-pointer transition-transform hover:-translate-y-1 ${dark ? "bg-white/5 border-white/20 hover:bg-white/10" : "bg-white border-black hover:bg-[#f0edf9]"}`}
                >
                  <div className="w-14 h-14 bg-[var(--palette-accent)] rounded-full border-[3px] border-black flex items-center justify-center text-white">
                    <Plus size={28} strokeWidth={4} />
                  </div>
                  <span className={`font-extrabold text-[11px] text-center mt-2 ${dark ? "text-slate-300" : "text-black"}`}>Añadir Ensayo</span>
                </div>
              )}

              {/* Empty state for non-default sections */}
              {exams.length === 0 && section.id !== "default" && (
                <div className="col-span-full flex flex-col items-center justify-center py-8 gap-2 opacity-40">
                  <p className="text-white text-[11px] font-bold">Arrastra ensayos aquí</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Add section */}
      {showAddSection ? (
        <div className={`flex items-center gap-2 p-4 rounded-xl border-[2px] ${dark ? "border-white/10 bg-white/5" : "border-black bg-white"}`}>
          <input
            className={`text-sm font-bold px-3 py-2 rounded-lg border-[2px] focus:outline-none flex-1 max-w-xs ${dark ? "bg-white/10 border-white/20 text-white placeholder:text-white/30" : "bg-[#f4f2f9] border-black text-black"}`}
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            placeholder="Nombre de la sección..."
            onKeyDown={e => { if (e.key === "Enter") handleAddSection(); if (e.key === "Escape") { setShowAddSection(false); setNewSectionName(""); } }}
            autoFocus
          />
          <button onClick={handleAddSection} className="px-4 py-2 bg-[var(--palette-accent)] text-white font-black text-sm border-[3px] border-black rounded-lg hover:bg-[var(--palette-accent)] transition-all">
            Crear
          </button>
          <button onClick={() => { setShowAddSection(false); setNewSectionName(""); }} className={`px-3 py-2 font-bold text-sm border-2 rounded-lg ${dark ? "border-white/20 text-slate-400 hover:bg-white/10" : "border-black text-black hover:bg-black/5"}`}>
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSection(true)}
          className={`flex items-center gap-2 px-5 py-3 font-extrabold text-sm border-[3px] rounded-xl transition-all hover:-translate-y-0.5 w-full justify-center ${dark ? "bg-white/5 border-white/20 text-slate-200 hover:bg-white/10" : "bg-white border-black text-black hover:bg-[#f0edf9]"}`}
        >
          <Plus size={18} strokeWidth={3} />
          Nueva Sección
        </button>
      )}

      {/* ── Context menu overlay ── */}
      {ctxMenu && (() => {
        const exam = savedExams.find(e => e.id === ctxMenu.examId);
        if (!exam) return null;
        const status = STATUSES.find(s => s.key === (exam.status || "none")) ?? STATUSES[0];
        const nextStatus = STATUSES[(STATUSES.findIndex(s => s.key === status.key) + 1) % STATUSES.length];
        return (
          <>
            {/* backdrop */}
            <div className="fixed inset-0 z-40" onClick={closeCtxMenu} onContextMenu={e => { e.preventDefault(); closeCtxMenu(); }} />
            {/* menu */}
            <div
              className={`fixed z-50 min-w-[180px] rounded-xl border-[3px] overflow-hidden text-sm font-bold ${dark ? "bg-[#1a0f38] border-white/20 text-slate-100" : "bg-white border-black text-black"
                }`}
              style={{ top: Math.min(ctxMenu.y, window.innerHeight - 200), left: Math.min(ctxMenu.x, window.innerWidth - 200) }}
            >
              {/* header */}
              <div className={`px-4 py-2 text-[10px] uppercase tracking-widest font-black opacity-50 border-b-2 ${dark ? "border-white/10" : "border-black/10"}`}>
                {exam.customLabel || exam.metadata?.asignatura || "Ensayo"}
              </div>
              {/* Rename */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-[#f0edf9]"
                  }`}
                onClick={() => {
                  setEditingLabelId(exam.id);
                  setEditingLabel(exam.customLabel || exam.metadata?.asignatura || "");
                  closeCtxMenu();
                }}
              >
                <PenBox size={15} className={dark ? "text-indigo-400" : "text-[var(--palette-accent)]"} />
                Renombrar
              </button>
              {/* Status */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-[#f0edf9]"
                  }`}
                onClick={() => cycleStatus(exam)}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-2 border-black shrink-0 ${nextStatus.color}`} />
                Estado: <span className="opacity-60">{status.label}</span> → <span>{nextStatus.label}</span>
              </button>
              {/* Divider */}
              <div className={`border-t-2 ${dark ? "border-white/10" : "border-black/10"}`} />
              {/* Delete */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-rose-500/10 transition-colors"
                onClick={() => { onDeleteExam(exam.id); closeCtxMenu(); }}
              >
                <Trash2 size={15} />
                Eliminar ensayo
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ProgresoTab — goals + results table with grouping
// ────────────────────────────────────────────────────────────────────────────
function ProgresoTab({ goals, results, onUpdateGoals, onDeleteResult, dark, isMobile }: {
  goals: Goals;
  results: ExamResult[];
  onUpdateGoals: (g: Goals) => void;
  onDeleteResult: (id: number) => void;
  dark: boolean;
  isMobile: boolean;
}) {
  const [localGoals, setLocalGoals] = useState<Goals>({ ...goals });
  const [saved, setSaved] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "group" | "asignatura" | "año">("group");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editGroup, setEditGroup] = useState("");

  const tx = dark ? "text-slate-100" : "text-black";
  const sub = dark ? "text-slate-400" : "text-slate-600";
  const inputCls = `p-2.5 border-2 rounded-lg font-bold text-sm w-32 ${dark ? "bg-white/10 border-white/20 text-slate-100" : "bg-[#f4f2f9] border-black text-black"}`;
  const cardCls = `border-[4px] rounded-2xl p-6 flex flex-col gap-4 ${dark ? "bg-[#12112a] border-white/10" : "bg-white border-black"}`;

  const saveGoals = () => { onUpdateGoals(localGoals); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const togglePrueba = (pid: string) => {
    const cur = localGoals.pruebasSeleccionadas;
    setLocalGoals({ ...localGoals, pruebasSeleccionadas: cur.includes(pid) ? cur.filter(x => x !== pid) : [...cur, pid] });
  };

  // group results
  const grouped: Record<string, ExamResult[]> = {};
  if (groupBy === "none") {
    grouped["Todos los ensayos"] = results;
  } else {
    results.forEach(r => {
      const key = groupBy === "group" ? r.group : groupBy === "asignatura" ? r.asignatura : String(r.año);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
  }

  const toggleCollapse = (k: string) => setCollapsed(c => ({ ...c, [k]: !c[k] }));

  return (
    <div className="w-full flex flex-col gap-8">

      {/* ── Goals section ── */}
      <div className={cardCls}>
        <h2 className="text-[1.8rem] font-black uppercase tracking-tighter text-[var(--palette-accent)]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>
          Mis Metas
        </h2>

        <div className="flex gap-6 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold ${sub}`}>Puntaje Deseado (global)</label>
            <input type="number" className={inputCls} value={localGoals.puntajeDeseado}
              onChange={e => setLocalGoals({ ...localGoals, puntajeDeseado: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs font-bold ${sub}`}>Ensayos Semanales</label>
            <input type="number" className={inputCls} value={localGoals.ensayosSemanales}
              onChange={e => setLocalGoals({ ...localGoals, ensayosSemanales: parseInt(e.target.value) || 0 })} />
          </div>
        </div>

        {/* Prueba selection */}
        <div>
          <p className={`text-xs font-bold mb-2 ${sub}`}>Pruebas que rindo</p>
          <div className="flex flex-wrap gap-2">
            {PRUEBAS_DISPONIBLES.map(p => {
              const sel = localGoals.pruebasSeleccionadas.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePrueba(p.id)}
                  className={`px-3 py-1.5 rounded-lg border-[3px] font-black text-sm transition-all
                    ${sel ? "bg-[var(--palette-accent)] border-[var(--palette-accent)] text-white"
                      : dark ? "bg-white/5 border-white/20 text-slate-300 hover:border-indigo-400"
                        : "bg-[#f4f2f9] border-black text-black hover:bg-[#e2deef]"}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Per-prueba scores */}
        {localGoals.pruebasSeleccionadas.length > 0 && (
          <div>
            <p className={`text-xs font-bold mb-2 ${sub}`}>Puntaje objetivo por prueba</p>
            <div className="flex flex-wrap gap-3">
              {localGoals.pruebasSeleccionadas.map(pid => {
                const prueba = PRUEBAS_DISPONIBLES.find(p => p.id === pid)!;
                return (
                  <div key={pid} className="flex flex-col gap-1">
                    <label className={`text-[10px] font-bold ${sub}`}>{prueba.label}</label>
                    <input type="number" className={`${inputCls} w-24`}
                      value={localGoals.puntajesPorPrueba[pid] ?? localGoals.puntajeDeseado}
                      onChange={e => setLocalGoals({ ...localGoals, puntajesPorPrueba: { ...localGoals.puntajesPorPrueba, [pid]: parseInt(e.target.value) || 0 } })} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={saveGoals}
          className={`self-start px-6 py-2 text-sm font-black border-[3px] rounded-lg transition-all active:translate-y-0.5 active:shadow-none
            ${saved ? "bg-emerald-500 border-emerald-700 text-white" : "bg-[var(--palette-success)] border-black text-white hover:bg-[#1a6640]"}`}
        >
          {saved ? "Guardado!" : "Guardar Metas"}
        </button>
      </div>

      {/* ── Results table ── */}
      <div className={cardCls}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-[1.6rem] font-black uppercase tracking-tighter text-[var(--palette-accent)]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.2)" }}>
            Historial de Resultados
          </h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${sub}`}>Agrupar por:</span>
            <select
              value={groupBy}
              onChange={e => setGroupBy(e.target.value as any)}
              className={`text-sm font-bold border-2 rounded-lg px-3 py-1.5 focus:outline-none ${dark ? "bg-white/10 border-white/20 text-slate-100" : "bg-[#f4f2f9] border-black text-black"}`}
            >
              <option value="none">Sin agrupación</option>
              <option value="group">Grupo</option>
              <option value="asignatura">Asignatura</option>
              <option value="año">Año</option>
            </select>
          </div>
        </div>

        {results.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-12 gap-3 ${sub}`}>
            <FolderOpen size={40} className="opacity-30" />
            <p className="text-sm font-semibold">No hay resultados guardados aún.</p>
            <p className="text-xs opacity-60">Realiza un ensayo y guarda tu puntaje para verlo aquí.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(grouped).map(([groupName, items]) => {
              const isCollapsed = collapsed[groupName];
              const avg = Math.round(items.reduce((s, r) => s + r.score, 0) / items.length);
              return (
                <div key={groupName} className={`border-2 rounded-xl overflow-hidden ${dark ? "border-white/10" : "border-black"}`}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleCollapse(groupName)}
                    className={`w-full flex items-center justify-between px-4 py-3 font-extrabold text-sm ${dark ? "bg-white/5 hover:bg-white/10 text-slate-200" : "bg-[#f4f2f9] hover:bg-[#e2deef] text-black"} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen size={16} className={dark ? "text-indigo-400" : "text-[var(--palette-accent)]"} />
                      <span>{groupName}</span>
                      <span className={`text-xs font-normal ${sub}`}>({items.length} ensayo{items.length !== 1 ? "s" : ""})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dark ? "bg-indigo-500/30 text-indigo-300" : "bg-[#e2deef] text-[var(--palette-accent)]"}`}>
                        Prom: {avg} pts
                      </span>
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                  </button>

                  {/* Table / Mobile Cards */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto">
                      {isMobile ? (
                        <div className="flex flex-col">
                          {items.map((r, ri) => (
                            <div key={r.id} className={`p-4 border-t ${dark ? "border-white/5" : "border-black/5"} flex flex-col gap-2`}>
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-bold ${sub}`}>{r.date}</span>
                                <span className={`text-xs px-2 py-0.5 rounded bg-white/10 ${sub}`}>{r.group}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className={`font-bold text-sm ${tx}`}>{r.asignatura}</p>
                                  <p className={`text-[10px] ${sub}`}>{r.año} • {Math.floor(r.elapsedSecs / 60)} min • {r.answered}/{r.total} resp.</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`font-black text-xl ${r.score >= 700 ? "text-emerald-500" : r.score >= 500 ? "text-amber-400" : "text-rose-400"}`}>
                                    {r.score}
                                  </span>
                                  <button onClick={() => onDeleteResult(r.id)} className="text-rose-400">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`text-xs font-bold uppercase ${dark ? "bg-white/5 text-slate-400" : "bg-[#f9f7ff] text-slate-500"}`}>
                              <th className="px-4 py-2 text-left">Fecha</th>
                              <th className="px-4 py-2 text-left">Asignatura</th>
                              <th className="px-4 py-2 text-left">Año</th>
                              <th className="px-4 py-2 text-left">Grupo</th>
                              <th className="px-4 py-2 text-right">Puntaje</th>
                              <th className="px-4 py-2 text-right">Resp.</th>
                              <th className="px-4 py-2 text-right">Tiempo</th>
                              <th className="px-4 py-2" />
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((r, ri) => {
                              const t = r.elapsedSecs;
                              const timeStr = `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
                              const isEven = ri % 2 === 0;
                              return (
                                <tr key={r.id} className={`border-t ${dark ? "border-white/5" : "border-black/5"} ${isEven ? dark ? "bg-white/0" : "bg-white" : dark ? "bg-white/[0.03]" : "bg-[#faf9ff]"}`}>
                                  <td className={`px-4 py-2.5 ${sub}`}>{r.date}</td>
                                  <td className={`px-4 py-2.5 font-semibold ${tx}`}>{r.asignatura}</td>
                                  <td className={`px-4 py-2.5 ${sub}`}>{r.año}</td>
                                  <td className="px-4 py-2.5">
                                    {editingId === r.id ? (
                                      <div className="flex gap-1">
                                        <input
                                          className={`text-xs p-1 border rounded w-28 focus:outline-none ${dark ? "bg-white/10 border-white/20 text-white" : "bg-[#f4f2f9] border-black"}`}
                                          value={editGroup}
                                          onChange={e => setEditGroup(e.target.value)}
                                          autoFocus
                                        />
                                        <button className="text-emerald-400 text-xs font-bold px-1"
                                          onClick={() => { /* TODO: persist edit in parent if needed */ setEditingId(null); }}>Guardar</button>
                                      </div>
                                    ) : (
                                      <span className={`text-xs cursor-pointer hover:underline ${sub}`} onClick={() => { setEditingId(r.id); setEditGroup(r.group); }}>{r.group}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span className={`font-black text-base ${r.score >= 700 ? "text-emerald-500" : r.score >= 500 ? "text-amber-400" : "text-rose-400"}`}>
                                      {r.score}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-2.5 text-right text-xs ${sub}`}>{r.answered}/{r.total}</td>
                                  <td className={`px-4 py-2.5 text-right text-xs font-mono ${sub}`}>{timeStr}</td>
                                  <td className="px-4 py-2.5 text-right">
                                    <button onClick={() => onDeleteResult(r.id)} className="text-rose-400 hover:text-rose-300 transition-colors p-1" title="Eliminar">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

