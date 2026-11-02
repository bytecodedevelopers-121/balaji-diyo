import { Extension } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";

export interface IndentOptions {
  types: string[];
  minIndent: number;
  maxIndent: number;
  indentSizePx: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

// Paragraph/heading indent via a `margin-left` attribute. List indent is
// handled separately by sinkListItem/liftListItem (see ToolbarButtons) —
// this only covers block nodes outside of lists.
export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minIndent: 0,
      maxIndent: 8,
      indentSizePx: 24,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const margin = parseInt(element.style.marginLeft || "0", 10);
              return Number.isNaN(margin) ? 0 : Math.round(margin / this.options.indentSizePx);
            },
            renderHTML: (attributes) => {
              if (!attributes.indent) return {};
              return { style: `margin-left: ${attributes.indent * this.options.indentSizePx}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const types = this.options.types;
    const { minIndent, maxIndent } = this.options;

    const applyIndent = (delta: number, tr: Transaction) => {
      let changed = false;
      tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, pos) => {
        if (types.includes(node.type.name)) {
          const current = (node.attrs.indent as number) || 0;
          const next = Math.min(maxIndent, Math.max(minIndent, current + delta));
          if (next !== current) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            changed = true;
          }
        }
      });
      return changed;
    };

    return {
      indent:
        () =>
        ({ tr, dispatch }) => {
          const changed = applyIndent(1, tr);
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
      outdent:
        () =>
        ({ tr, dispatch }) => {
          const changed = applyIndent(-1, tr);
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});
