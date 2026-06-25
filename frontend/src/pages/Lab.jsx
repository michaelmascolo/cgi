import Stepper from "@/components/Stepper";
import { useLab } from "@/context/LabContext";
import IssueInputStep from "@/steps/IssueInputStep";
import PositionMappingStep from "@/steps/PositionMappingStep";
import NeedsStep from "@/steps/NeedsStep";
import SolutionsStep from "@/steps/SolutionsStep";
import ReflectionStep from "@/steps/ReflectionStep";

export default function Lab() {
  const { step } = useLab();
  const steps = [IssueInputStep, PositionMappingStep, NeedsStep, SolutionsStep, ReflectionStep];
  const Current = steps[step];

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
      <Stepper step={step} />
      <Current />
    </div>
  );
}
