import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, RefreshCw, Check, CircleDashed, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useLab } from "@/context/LabContext";

export default function SolutionsStep() {
  const { map, update, setStep } = useLab();
  const [loading, setLoading] = useState(false);

  const regenerate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/solutions", {
        issue: map.issue,
        position_a: map.position_a,
        position_b: map.position_b,
        needs_a: map.needs_a,
        needs_b: map.needs_b,
      });
      update({ solutions: data.solutions || [] });
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#2D2A26]">Collaborative Solutions</h2>
        <button
          onClick={regenerate}
          disabled={loading}
          data-testid="regenerate-solutions-button"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border border-[#4A5D4E]/30 text-[#4A5D4E] hover:bg-[#F5F2EA] transition-all disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Regenerate
        </button>
      </div>
      <p className="text-[#6E6860] mb-8">
        Novel, integrative ideas that try to satisfy needs on both sides — not just split the difference.
      </p>

      {loading ? (
        <div className="space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-white border border-[#E8E3D9] animate-breathe" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : (
        <div className="space-y-5" data-testid="solutions-list">
          {(map.solutions || []).map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-white border border-[#E8E3D9] p-6 sm:p-7 shadow-sm"
              data-testid={`solution-card-${i}`}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-serif text-2xl text-[#4A5D4E]">{i + 1}</span>
                <h3 className="font-serif text-xl text-[#2D2A26]">{s.title}</h3>
              </div>
              <p className="text-[#2D2A26] leading-relaxed mb-5">{s.description}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <NeedList icon={Check} color="#4A5D4E" label="Needs met — your side" items={s.needs_satisfied_a} />
                <NeedList icon={Check} color="#C4A265" label="Needs met — other side" items={s.needs_satisfied_b} />
              </div>

              {s.needs_unaddressed?.length > 0 && (
                <div className="mt-4">
                  <NeedList icon={CircleDashed} color="#6E6860" label="Not yet fully addressed" items={s.needs_unaddressed} />
                </div>
              )}

              {s.improvements && (
                <div className="mt-5 flex gap-2.5 rounded-xl bg-[#F5F2EA] p-4">
                  <Wrench className="h-4 w-4 text-[#4A5D4E] mt-0.5 shrink-0" strokeWidth={1.5} />
                  <p className="text-sm text-[#6E6860] leading-relaxed">
                    <span className="font-medium text-[#2D2A26]">Possible improvements: </span>
                    {s.improvements}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-between">
        <button onClick={() => setStep(2)} data-testid="solutions-back-button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={() => setStep(4)}
          data-testid="solutions-continue-button"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5"
        >
          Reflect <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function NeedList({ icon: Icon, color, label, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] mb-2" style={{ color }}>{label}</p>
      <ul className="space-y-1.5">
        {items.map((n, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#2D2A26]">
            <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} strokeWidth={1.75} />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
