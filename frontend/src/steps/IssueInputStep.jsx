import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useLab } from "@/context/LabContext";

const TOPIC_HINTS = [
  "Abortion", "Immigration", "Gun violence", "Free speech", "Affirmative action",
  "Economy", "Climate change", "Education", "Healthcare",
];

export default function IssueInputStep() {
  const { map, update, setStep } = useLab();
  const [loading, setLoading] = useState(false);

  const cont = async () => {
    if (!map.issue.trim() || !map.position_a.trim()) {
      toast.error("Please name the issue and your position.");
      return;
    }
    if (!map.position_b.trim()) {
      setLoading(true);
      try {
        const { data } = await api.post("/ai/opposing-position", { issue: map.issue, position_a: map.position_a });
        update({ position_b: data.opposing_position });
      } catch (e) {
        toast.error(formatApiError(e.response?.data?.detail));
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setStep(1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#2D2A26] mb-2">
        What social or political issue would you like to explore?
      </h2>
      <p className="text-[#6E6860] mb-6">This is your issue to define, in your own words.</p>

      <input
        value={map.issue}
        onChange={(e) => update({ issue: e.target.value })}
        placeholder="Name the issue you want to explore…"
        data-testid="issue-input"
        className="w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition"
      />

      <p className="text-sm text-[#A39E94] mt-3 leading-relaxed" data-testid="topic-hints">
        Some issues people explore: {TOPIC_HINTS.join(" · ")}. These are only examples — the issue is yours to choose.
      </p>

      <div className="mt-8 space-y-6">
        <Block label="What is your position on this issue?">
          <textarea
            value={map.position_a}
            onChange={(e) => update({ position_a: e.target.value })}
            placeholder="Describe your position…"
            rows={3}
            data-testid="position-a-input"
            className="w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition resize-none"
          />
        </Block>

        <Block label="What position do people on the other side usually take?" hint="Optional — leave blank and we'll draft a fair version for you.">
          <textarea
            value={map.position_b}
            onChange={(e) => update({ position_b: e.target.value })}
            placeholder="Optional…"
            rows={3}
            data-testid="position-b-input"
            className="w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition resize-none"
          />
        </Block>
      </div>

      <div className="mt-10 flex justify-end">
        <button
          onClick={cont}
          disabled={loading}
          data-testid="issue-continue-button"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Sparkles className="h-4 w-4 animate-pulse" /> Drafting the other side…
            </>
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function Block({ label, hint, children }) {
  return (
    <div>
      <label className="block text-base font-medium text-[#2D2A26] mb-1.5">{label}</label>
      {hint && <p className="text-sm text-[#6E6860] mb-2">{hint}</p>}
      {children}
    </div>
  );
}
