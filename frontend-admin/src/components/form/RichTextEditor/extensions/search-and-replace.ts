import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/core";

export interface SearchMatch {
  from: number;
  to: number;
}

interface SearchState {
  searchTerm: string;
  caseSensitive: boolean;
  activeIndex: number;
  results: SearchMatch[];
  decorations: DecorationSet;
}

interface SearchMeta {
  searchTerm?: string;
  caseSensitive?: boolean;
  activeIndex?: number;
}

export const searchAndReplacePluginKey = new PluginKey<SearchState>("searchAndReplace");

export function getSearchState(editor: Editor): SearchState | undefined {
  return searchAndReplacePluginKey.getState(editor.state);
}

function escapeRegExp(term: string) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findResults(doc: import("@tiptap/pm/model").Node, searchTerm: string, caseSensitive: boolean): SearchMatch[] {
  if (!searchTerm) return [];
  const regex = new RegExp(escapeRegExp(searchTerm), caseSensitive ? "g" : "gi");
  const results: SearchMatch[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(node.text))) {
      results.push({ from: pos + match.index, to: pos + match.index + match[0].length });
      if (match[0].length === 0) regex.lastIndex++;
    }
  });

  return results;
}

function buildDecorations(doc: import("@tiptap/pm/model").Node, results: SearchMatch[], activeIndex: number) {
  const decorations = results.map((result, i) =>
    Decoration.inline(result.from, result.to, {
      class: i === activeIndex ? "rte-search-match rte-search-match-active" : "rte-search-match",
    }),
  );
  return DecorationSet.create(doc, decorations);
}

// Highlights all occurrences of a search term and supports next/previous
// navigation plus single/all replace. No official TipTap extension covers
// this (search-and-replace is not part of the free extension set), so this
// implements the common ProseMirror decoration-based recipe: state lives in
// a plugin, recomputed only when the doc changes or a command dispatches
// meta — not on every selection-only transaction.
export const SearchAndReplace = Extension.create({
  name: "searchAndReplace",

  addCommands() {
    return {
      setSearchTerm:
        (searchTerm: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(searchAndReplacePluginKey, { searchTerm, activeIndex: 0 } satisfies SearchMeta);
          return true;
        },
      setSearchCaseSensitive:
        (caseSensitive: boolean) =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(searchAndReplacePluginKey, { caseSensitive } satisfies SearchMeta);
          return true;
        },
      goToNextSearchResult:
        () =>
        ({ editor, tr, dispatch }) => {
          const state = getSearchState(editor);
          if (!state || state.results.length === 0) return false;
          const activeIndex = (state.activeIndex + 1) % state.results.length;
          if (dispatch) tr.setMeta(searchAndReplacePluginKey, { activeIndex } satisfies SearchMeta);
          return true;
        },
      goToPreviousSearchResult:
        () =>
        ({ editor, tr, dispatch }) => {
          const state = getSearchState(editor);
          if (!state || state.results.length === 0) return false;
          const activeIndex = (state.activeIndex - 1 + state.results.length) % state.results.length;
          if (dispatch) tr.setMeta(searchAndReplacePluginKey, { activeIndex } satisfies SearchMeta);
          return true;
        },
      replaceCurrentSearchResult:
        (replaceTerm: string) =>
        ({ editor, chain }) => {
          const state = getSearchState(editor);
          const match = state?.results[state.activeIndex];
          if (!match) return false;
          return chain().insertContentAt({ from: match.from, to: match.to }, replaceTerm).run();
        },
      replaceAllSearchResults:
        (replaceTerm: string) =>
        ({ editor, tr, dispatch }) => {
          const state = getSearchState(editor);
          if (!state || state.results.length === 0) return false;
          [...state.results].reverse().forEach((match) => {
            tr.insertText(replaceTerm, match.from, match.to);
          });
          if (dispatch) dispatch(tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchAndReplacePluginKey,
        state: {
          init: () => ({
            searchTerm: "",
            caseSensitive: false,
            activeIndex: 0,
            results: [],
            decorations: DecorationSet.empty,
          }),
          apply(tr, prev) {
            const meta = tr.getMeta(searchAndReplacePluginKey) as SearchMeta | undefined;
            if (!meta && !tr.docChanged) return prev;

            const searchTerm = meta?.searchTerm ?? prev.searchTerm;
            const caseSensitive = meta?.caseSensitive ?? prev.caseSensitive;
            const results = findResults(tr.doc, searchTerm, caseSensitive);
            const activeIndex = meta?.activeIndex !== undefined ? meta.activeIndex : Math.min(prev.activeIndex, Math.max(results.length - 1, 0));

            return {
              searchTerm,
              caseSensitive,
              activeIndex,
              results,
              decorations: buildDecorations(tr.doc, results, activeIndex),
            };
          },
        },
        props: {
          decorations(state) {
            return searchAndReplacePluginKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchAndReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setSearchCaseSensitive: (value: boolean) => ReturnType;
      goToNextSearchResult: () => ReturnType;
      goToPreviousSearchResult: () => ReturnType;
      replaceCurrentSearchResult: (replaceTerm: string) => ReturnType;
      replaceAllSearchResults: (replaceTerm: string) => ReturnType;
    };
  }
}
