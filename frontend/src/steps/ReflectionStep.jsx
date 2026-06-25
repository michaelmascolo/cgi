import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Copy, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useLab } from "@/context/LabContext";
import { copyMarkdown, downloadText, exportPdf } from "@/lib/export";

const QUESTIONS = [
  { key: "promising", label: "Which solution seems most promising?" },
  { key: "unmet", label: "Which needs remain unmet?" },
  { key: "improve", label: "How could the solution be improved?" },
  { key: "changed", label: "Did this process change how you understand the conflict?" },
];

export default function ReflectionStep() {
  const { map, update, setStep, setMap } = useLab();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const setR = (key, val) => update({ reflection: { ...map.reflection, [key]: val } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: map.title || map.issue,
        issue: map.issue,
        position_a: map.position_a,
        position_b: map.position_b,
        concerns_a: map.concerns_a,
        needs_a: map.needs_a,
        needs_b: map.needs_b,
        solutions: map.solutions,
        reflection: map.reflection,
      };
      let data;
      if (map.id) {
        ({ data } = await api.put(`/maps/${map.id}`, payload));
      } else {
        ({ data } = await api.post("/maps", payload));
      }
      setMap({ ...map, id: data.id });
      toast.success("Issue map saved.");
      return data.id;
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const saveAndFinish = async () => {
    const id = await save();
    if (id) navigate("/dashboard");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-[#2D2A26] mb-2">Reflection</h2>
      <p className="text-[#6E6860] mb-8">A quiet moment to consider what you've discovered.</p>

      <div className="space-y-6">
        {QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="block text-base font-medium text-[#2D2A26] mb-2">{q.label}</label>
            <textarea
              value={map.reflection[q.key]}
              onChange={(e) => setR(q.key, e.target.value)}
              rows={3}
              data-testid={`reflection-${q.key}`}
              className="w-full rounded-xl border border-[#E8E3D9] bg-white px-4 py-3 text-[#2D2A26] placeholder:text-[#A39E94] focus:ring-2 focus:ring-[#4A5D4E] focus:outline-none transition resize-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl bg-[#F5F2EA] border border-[#E8E3D9] p-6">
        <p className="text-sm uppercase tracking-[0.2em] text-[#6E6860] mb-4">Save &amp; export your issue map</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={save} disabled={saving} data-testid="save-map-button" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={() => { copyMarkdown(map); toast.success("Copied to clipboard."); }} data-testid="copy-map-button" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E8E3D9] text-[#2D2A26] hover:bg-white/60 transition-all">
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button onClick={() => downloadText(map)} data-testid="download-map-button" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E8E3D9] text-[#2D2A26] hover:bg-white/60 transition-all">
            <Download className="h-4 w-4" /> Markdown
          </button>
          <button onClick={() => exportPdf(map)} data-testid="export-pdf-button" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E8E3D9] text-[#2D2A26] hover:bg-white/60 transition-all">
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      <div className="mt-10 flex justify-between">
        <button onClick={() => setStep(3)} data-testid="reflection-back-button" className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#6E6860] hover:bg-[#F5F2EA] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={saveAndFinish} disabled={saving} data-testid="finish-button" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#4A5D4E] text-[#FDFBF7] font-medium hover:bg-[#3B4A3E] transition-all hover:-translate-y-0.5 disabled:opacity-60">
          Save &amp; finish
        </button>
      </div>
    </motion.div>
  );
}
