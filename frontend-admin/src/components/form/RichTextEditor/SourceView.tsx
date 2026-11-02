interface SourceViewProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  minHeight: number;
}

export function SourceView({ value, onChange, disabled, minHeight }: SourceViewProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      spellCheck={false}
      aria-label="HTML source"
      style={{ minHeight }}
      className="w-full resize-y border-t border-gray-200 bg-gray-900 px-3 py-2 font-mono text-xs text-gray-100 outline-none"
    />
  );
}
