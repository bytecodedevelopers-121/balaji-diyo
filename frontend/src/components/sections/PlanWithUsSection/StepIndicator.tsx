import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  label: string;
}

/**
 * The "1 Preferences · 2 Details · 3 Review" stepper at the top of the
 * wizard card, present on all three design mockups (each screenshot
 * catches it at a different step — done/active/pending render as
 * checkmark/orange-number/grey-number there, reproduced here from all
 * three rather than just one).
 */
export function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: WizardStep[];
  currentIndex: number;
}) {
  return (
    <div className="flex items-start justify-between border-b border-brand-neutral-300 pb-6">
      {steps.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        return (
          <div key={step.id} className="flex flex-1 flex-col items-center gap-2">
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full font-poppins text-[14px] font-bold",
                isDone || isActive
                  ? "bg-secondary-500 text-brand-neutral-000"
                  : "bg-brand-neutral-200 text-brand-neutral-600",
              )}
            >
              {isDone ? <CheckIcon /> : index + 1}
            </span>
            <span
              className={cn(
                "font-poppins text-[14px] leading-[22.4px] font-medium",
                isDone || isActive ? "text-secondary-500" : "text-brand-neutral-600",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
