import { cn } from "@/utils";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-container-low p-1" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
            value === tab.value
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-on-surface-variant hover:bg-white/60 hover:text-on-surface",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
