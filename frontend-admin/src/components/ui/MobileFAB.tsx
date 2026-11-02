import { Plus } from "lucide-react";

interface MobileFABProps {
  onClick: () => void;
  label: string;
}

export function MobileFAB({ onClick, label }: MobileFABProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 md:hidden"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
