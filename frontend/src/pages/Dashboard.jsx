import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileText, Copy, Download, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLab } from "@/context/LabContext";
import { copyMarkdown, downloadText, exportPdf } from "@/lib/export";

export default function Dashboard() {
  const { user } = useAuth();
  const { reset, loadMap, setStep } = useLab();
  const navigate = useNavigate();
  const [maps, setMaps] = useState(null);
  const [examples, setExamples] = useState([]);

  const load = () => api.get("/maps").then((r) => setMaps(r.data)).catch(() => setMaps([]));
  useEffect(() => {
    load();
    api.get("/examples").then((r) => setExamples(r.data)).catch(() => {});
  }, []);

  const startNew = () => {
    reset();
    navigate("/lab");
  };

  const startExample = (ex) => {
    loadMap({ issue: ex.issue, position_a: ex.position_a, position_b: ex.position_b });
    navigate("/lab");
  };

  const open = (m) => {
    loadMap(m);
    setStep(4);
    navigate("/lab");
  };

  const remove = async (id) => {
    try {
      await api.delete(`/maps/${id}`);
      setMaps((prev) => prev.filter((m) => m.id !== id));
      toast.success("Deleted.");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-[#2D2A26]">
            Hello, {user?.name || "there"}
          </h1>
          <p className="text-[#6E6860] mt-2">Your saved issue maps and starting points.</p>
        </div>
        <button onClick={startNew} data-testid="dashboard-new-button" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 shadow-sm">
          <Plus className="h-5 w-5" /> Start a New Issue
        </button>
      </motion.div>

      {/* Saved maps */}
      <section className="mb-14">
        <h2 className="font-serif text-xl text-[#2D2A26] mb-4">My issue maps</h2>
        {maps === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => <div key={i} className="h-44 rounded-2xl bg-white border border-[#E8E3D9] animate-breathe" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        ) : maps.length === 0 ? (
          <div className="rounded-2xl bg-[#F5F2EA] border border-dashed border-[#D9C5B2] p-10 text-center">
            <p className="text-[#6E6860]">You haven't saved any issue maps yet. Start one above or pick a starter below.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="saved-maps-list">
            {maps.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white border border-[#E8E3D9] p-6 shadow-sm flex flex-col" data-testid={`saved-map-${m.id}`}>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6E6860]">{m.issue}</p>
                <h3 className="font-serif text-lg text-[#2D2A26] mt-1 mb-2 line-clamp-2">{m.title || m.issue}</h3>
                <p className="text-sm text-[#6E6860] line-clamp-2 flex-1">{m.position_a}</p>
                <p className="text-xs text-[#A39E94] mt-3">{m.solutions?.length || 0} solutions · {(m.needs_a?.length || 0) + (m.needs_b?.length || 0)} needs</p>
                <div className="flex items-center gap-1 mt-4 pt-4 border-t border-[#E8E3D9]">
                  <button onClick={() => open(m)} data-testid={`open-map-${m.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm bg-[#F5F2EA] text-[#2D2A26] hover:bg-[#D9C5B2]/40 transition-colors">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { copyMarkdown(m); toast.success("Copied."); }} title="Copy" className="p-2 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => downloadText(m)} title="Markdown" className="p-2 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors"><Download className="h-4 w-4" /></button>
                  <button onClick={() => exportPdf(m)} title="PDF" className="p-2 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors"><FileText className="h-4 w-4" /></button>
                  <button onClick={() => remove(m.id)} data-testid={`delete-map-${m.id}`} title="Delete" className="p-2 rounded-full text-[#6E6860] hover:text-[#B27A70] hover:bg-[#F5F2EA] transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Starter examples */}
      <section>
        <h2 className="font-serif text-xl text-[#2D2A26] mb-4">Starter examples</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {examples.map((ex) => (
            <button key={ex.key} onClick={() => startExample(ex)} data-testid={`starter-${ex.key}`} className="text-left rounded-2xl bg-white border border-[#E8E3D9] p-6 shadow-sm hover:-translate-y-0.5 hover:border-[#D9C5B2] transition-all group">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F2EA] mb-3">
                <Sparkles className="h-4 w-4 text-[#4A5D4E]" strokeWidth={1.5} />
              </span>
              <h3 className="font-serif text-lg text-[#2D2A26] mb-1.5">{ex.issue}</h3>
              <p className="text-sm text-[#6E6860] line-clamp-2">{ex.position_a}</p>
              <span className="inline-flex items-center gap-1 text-sm text-[#4A5D4E] mt-3 font-medium">
                Explore <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
