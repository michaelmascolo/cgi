import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useLab } from "@/context/LabContext";

export default function PositionMappingStep() {
  const { map, update, setStep } = useLab();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const suggest = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/concerns", { issue: map.issue, position: map.position_a });
      setSuggestions(data.suggestions || []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
    setLoading(false);
  };

  const addSuggestion = (s) => {
    const prefix = map.concerns_a.trim() ? map.concerns_a.trim() + "\n" : "";
    update({ concerns_a: prefix + "• " + s });
    setSuggestions((prev) => prev.filter((x) => x !== s));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#2D2A26] mb-6">Position Mapping</h2>

      <div className="rounded-2xl bg-[#F5F2EA] border border-[#E8E3D9] p-6 mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[#6E6860]">Issue</p>
        <p className="font-serif text-xl text-[#2D2A26] mt-1" data-testid="mapping-issue">{map.issue}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <div className="rounded-2xl bg-white border border-[#E8E3D9] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#4A5D4E] mb-2">Your position</p>
          <p className="text-[#2D2A26] leading-relaxed" data-testid="mapping-position-a">{map.position_a}</p>
        </div>
        <div className="rounded-2xl bg-white border border-[#E8E3D9] p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#C4A265] mb-2">Opposing position</p>
          <textarea
            value={map.position_b}
            onChange={(e) => update({ position_b: e.target.value })}
            rows={3}
            data-testid="mapping-position-b"
            className="w-full bg-transparent text-[#2D2A26] leading-relaxed focus:outline-none resize-none"
          />
        </div>
      </div>

      <label className="block text-base font-medium text-[#2D2A26] mb-1.5">
        What concerns, fears, values, or hopes are behind your position?
      </label>
      <p className="text-sm text-[#6E6860] mb-3">Not sure? Ask for gentle suggestions below.</p>
      <textarea
        value={map.concerns_a}
        onChange={(e) => update({ concerns_a: e.target.value })}
        rows={5}
        placeholder="I worry that… I value… I hope that…"
        data-testid="concerns-input"
        className="w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition resize-none"
      />

      <button
        onClick={suggest}
        disabled={loading}
        data-testid="suggest-concerns-button"
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#4A5D4E]/30 text-[#4A5D4E] hover:bg-[#F5F2EA] transition-all disabled:opacity-60"
      >
        <Sparkles className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
        {loading ? "Thinking…" : "Suggest concerns"}
      </button>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => addSuggestion(s)}
              data-testid={`concern-suggestion-${i}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-[#F5F2EA] text-[#2D2A26] border border-[#E8E3D9] hover:bg-[#D9C5B2]/40 transition-all text-left"
            >
              <Plus className="h-3.5 w-3.5 text-[#4A5D4E]" /> {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <button onClick={() => setStep(0)} data-testid="mapping-back-button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={() => setStep(2)}
          data-testid="mapping-continue-button"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
