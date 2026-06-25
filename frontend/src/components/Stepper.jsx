const STEPS = ["Issue", "Positions", "Needs", "Solutions", "Reflection"];

export default function Stepper({ step }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-10" data-testid="wizard-stepper">
      <p className="text-sm uppercase tracking-[0.2em] text-[#6E6860]">
        Step {step + 1} of {STEPS.length} — {STEPS[step]}
      </p>
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step ? "w-10 bg-[#4A5D4E]" : i < step ? "w-6 bg-[#4A5D4E]/50" : "w-6 bg-[#E8E3D9]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
