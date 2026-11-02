import { useCallback, useRef, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { cn } from "@/utils";

const MIN_WIDTH = 60;

export function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = wrapperRef.current?.querySelector("img")?.offsetWidth ?? 0;
      setIsResizing(true);

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = Math.max(MIN_WIDTH, Math.round(startWidth + delta));
        updateAttributes({ width: nextWidth });
      };

      const onUp = () => {
        setIsResizing(false);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [updateAttributes],
  );

  return (
    <NodeViewWrapper as="span" className="rte-image-wrapper" data-drag-handle>
      <span
        ref={wrapperRef}
        className={cn("group relative inline-block leading-none", selected && "rte-image-selected")}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? undefined}
          width={node.attrs.width ?? undefined}
          style={{ maxWidth: "100%", height: "auto" }}
          className="rounded-md"
          draggable={false}
        />
        {selected && (
          <span
            onPointerDown={startResize}
            role="presentation"
            title="Drag to resize"
            className={cn(
              "absolute bottom-1 right-1 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border-2 border-white bg-indigo-600 shadow",
              isResizing && "bg-indigo-700",
            )}
          />
        )}
      </span>
    </NodeViewWrapper>
  );
}
