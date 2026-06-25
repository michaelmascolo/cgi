import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, RefreshCw, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useLab } from "@/context/LabContext";

export default function NeedsStep() {
  const { map, update, setStep } = useLab();
  const [loading, setLoading] = useState(false);
  const [solving, setSolving] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/needs", {
        issue: map.issue,
        position_a: map.position_a,
        position_b: map.position_b,
        concerns_a: map.concerns_a,
      });
      update({ needs_a: data.needs_a || [], needs_b: data.needs_b || [] });
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
    setLoading(false);
  };

  useEffect(() => {
    if ((map.needs_a?.length || 0) === 0 && (map.needs_b?.length || 0) === 0) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goSolutions = async () => {
    if (!map.needs_a.length || !map.needs_b.length) {
      toast.error("Add at least one need on each side first.");
      return;
    }
    setSolving(true);
    try {
      const { data } = await api.post("/ai/solutions", {
        issue: map.issue,
        position_a: map.position_a,
        position_b: map.position_b,
        needs_a: map.needs_a,
        needs_b: map.needs_b,
      });
      update({ solutions: data.solutions || [] });
      setStep(3);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
    setSolving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#2D2A26]">Underlying Needs</h2>
        <button
          onClick={generate}
          disabled={loading}
          data-testid="regenerate-needs-button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#4A5D4E]/30 text-[#4A5D4E] hover:bg-[#F5F2EA] transition-all disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Regenerate
        </button>
      </div>
      <p className="text-[#6E6860] mb-8">
        Beneath every position are legitimate human needs. Edit, add, or remove any of them.
      </p>

      {loading ? (
        <Loading />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          <NeedsColumn
            title="Your position"
            accent="#4A5D4E"
            position={map.position_a}
            needs={map.needs_a}
            side="a"
            onChange={(arr) => update({ needs_a: arr })}
          />
          <NeedsColumn
            title="Opposing position"
            accent="#C4A265"
            position={map.position_b}
            needs={map.needs_b}
            side="b"
            onChange={(arr) => update({ needs_b: arr })}
          />
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <button onClick={() => setStep(1)} data-testid="needs-back-button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={goSolutions}
          disabled={solving || loading}
          data-testid="generate-solutions-button"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          {solving ? "Designing solutions…" : "Generate Collaborative Solutions"}
          {!solving && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </motion.div>
  );
}

function NeedsColumn({ title, accent, position, needs, side, onChange }) {
  const [draft, setDraft] = useState("");
  const remove = (i) => onChange(needs.filter((_, idx) => idx !== i));
  const edit = (i, val) => onChange(needs.map((n, idx) => (idx === i ? val : n)));
  const add = () => {
    if (!draft.trim()) return;
    onChange([...needs, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="rounded-2xl bg-white border border-[#E8E3D9] p-6">
      <p className="text-sm uppercase tracking-[0.2em] mb-1" style={{ color: accent }}>{title}</p>
      <p className="text-sm text-[#6E6860] mb-4 line-clamp-2">{position}</p>
      <div className="space-y-2.5">
        {needs.map((n, i) => (
          <div key={i} className="group flex items-center gap-2 rounded-full bg-[#F5F2EA] border border-[#E8E3D9] pl-4 pr-2 py-1.5" data-testid={`need-chip-${side}-${i}`}>
            <input
              value={n}
              onChange={(e) => edit(i, e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#2D2A26] focus:outline-none"
            />
            <button onClick={() => remove(i)} data-testid={`need-remove-${side}-${i}`} className="p-1 rounded-full text-[#A39E94] hover:text-[#B27A70] hover:bg-white transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a need…"
          data-testid={`need-add-input-${side}`}
          className="flex-1 rounded-full border border-[#E8E3D9] bg-white px-4 py-1.5 text-sm text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition"
        />
        <button onClick={add} data-testid={`need-add-button-${side}`} className="p-2 rounded-full bg-[#4A5D4E] text-[#FDFBF7] hover:bg-[#3B4A3E] transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {[0, 1].map((c) => (
        <div key={c} className="rounded-2xl bg-white border border-[#E8E3D9] p-6 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded-full bg-[#F5F2EA] animate-breathe" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ))}
    </div>
  );
}
