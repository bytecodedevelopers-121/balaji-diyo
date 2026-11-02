import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSearchState } from "../extensions/search-and-replace";

interface FindReplacePanelProps {
  editor: Editor;
  onClose: () => void;
}

export function FindReplacePanel({ editor, onClose }: FindReplacePanelProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const state = getSearchState(editor);
  const total = state?.results.length ?? 0;
  const current = total > 0 ? (state?.activeIndex ?? 0) + 1 : 0;

  useEffect(() => {
    searchInputRef.current?.focus();
    return () => {
      editor.chain().setSearchTerm("").run();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replaceCurrent = () => {
    editor.chain().focus().replaceCurrentSearchResult(replaceInputRef.current?.value ?? "").run();
  };

  const replaceAll = () => {
    editor.chain().focus().replaceAllSearchResults(replaceInputRef.current?.value ?? "").run();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 bg-amber-50/60 px-2 py-1.5">
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Find…"
        defaultValue={state?.searchTerm ?? ""}
        onChange={(e) => editor.chain().setSearchTerm(e.target.value).run()}
        onKeyDown={(e) => {
          if (e.key === "Enter") editor.chain().goToNextSearchResult().run();
          if (e.key === "Escape") onClose();
        }}
        className="w-40 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-indigo-500"
      />
      <span className="min-w-[4.5rem] text-xs text-gray-500">{total > 0 ? `${current} of ${total}` : "No results"}</span>

      <button
        type="button"
        title="Previous match"
        disabled={total === 0}
        onClick={() => editor.chain().focus().goToPreviousSearchResult().run()}
        className="rounded p-1 text-gray-600 hover:bg-gray-200/70 disabled:opacity-40"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Next match"
        disabled={total === 0}
        onClick={() => editor.chain().focus().goToNextSearchResult().run()}
        className="rounded p-1 text-gray-600 hover:bg-gray-200/70 disabled:opacity-40"
      >
        <ChevronDown className="h-4 w-4" />
      </button>

      <input
        ref={replaceInputRef}
        type="text"
        placeholder="Replace with…"
        onKeyDown={(e) => {
          if (e.key === "Enter") replaceCurrent();
        }}
        className="w-40 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-indigo-500"
      />

      <Button type="button" variant="outline" size="sm" disabled={total === 0} onClick={replaceCurrent}>
        Replace
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={total === 0} onClick={replaceAll}>
        Replace all
      </Button>

      <button type="button" title="Close" onClick={onClose} className="ml-auto rounded p-1 text-gray-500 hover:bg-gray-200/70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
