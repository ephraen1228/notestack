"use client";

import { useState, useCallback, useRef } from "react";
import { X, ChevronUp, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FindInNoteProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

export function FindInNote({ editorRef, onClose }: FindInNoteProps) {
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(0);
  const matchesRef = useRef<Range[]>([]);
  const currentIndexRef = useRef(0);

  const clearHighlights = useCallback(() => {
    if (!editorRef.current) return;
    const marks = editorRef.current.querySelectorAll("mark[data-find]");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
  }, [editorRef]);

  const doFind = useCallback(
    (q: string) => {
      clearHighlights();
      matchesRef.current = [];
      currentIndexRef.current = 0;
      setTotal(0);
      setCurrent(0);

      if (!q.trim() || !editorRef.current) return;

      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );
      const textNodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node as Text);
      }

      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      let count = 0;

      textNodes.forEach((textNode) => {
        const text = textNode.textContent || "";
        let match;
        const parts: (string | "match")[] = [];
        let lastIndex = 0;
        regex.lastIndex = 0;
        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex)
            parts.push(text.slice(lastIndex, match.index));
          parts.push("match");
          lastIndex = match.index + match[0].length;
          count++;
        }
        if (lastIndex < text.length) parts.push(text.slice(lastIndex));

        if (parts.some((p) => p === "match")) {
          const fragment = document.createDocumentFragment();
          parts.forEach((part) => {
            if (part === "match") {
              const mark = document.createElement("mark");
              mark.setAttribute("data-find", "true");
              mark.style.backgroundColor = "rgba(250, 204, 21, 0.5)";
              mark.style.borderRadius = "2px";
              mark.style.padding = "0 1px";
              regex.lastIndex = 0;
              const found = regex.exec(text.slice(0));
              regex.lastIndex = 0;
              mark.textContent = found ? found[0] : q;
              fragment.appendChild(mark);
            } else {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          textNode.parentNode?.replaceChild(fragment, textNode);
        }
      });

      const allMarks = editorRef.current.querySelectorAll("mark[data-find]");
      allMarks.forEach((mark, i) => {
        (mark as HTMLElement).style.backgroundColor =
          i === 0 ? "rgba(251, 146, 60, 0.7)" : "rgba(250, 204, 21, 0.5)";
      });

      setTotal(count);
      if (count > 0) {
        setCurrent(1);
        currentIndexRef.current = 0;
        (allMarks[0] as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [clearHighlights, editorRef]
  );

  const navigate = useCallback(
    (direction: "next" | "prev") => {
      if (!editorRef.current || total === 0) return;
      const allMarks = editorRef.current.querySelectorAll("mark[data-find]");
      (allMarks[currentIndexRef.current] as HTMLElement).style.backgroundColor =
        "rgba(250, 204, 21, 0.5)";

      if (direction === "next") {
        currentIndexRef.current = (currentIndexRef.current + 1) % total;
      } else {
        currentIndexRef.current = (currentIndexRef.current - 1 + total) % total;
      }

      const target = allMarks[currentIndexRef.current] as HTMLElement;
      target.style.backgroundColor = "rgba(251, 146, 60, 0.7)";
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrent(currentIndexRef.current + 1);
    },
    [editorRef, total]
  );

  const handleClose = () => {
    clearHighlights();
    onClose();
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background border rounded-lg shadow-lg">
      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        autoFocus
        placeholder="Find in note..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          doFind(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(e.shiftKey ? "prev" : "next");
          if (e.key === "Escape") handleClose();
        }}
        className="h-7 w-48 border-0 bg-transparent focus-visible:ring-0 p-0 text-sm"
      />
      {total > 0 && (
        <span className="text-xs text-muted-foreground shrink-0">
          {current}/{total}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => navigate("prev")}
        disabled={total === 0}
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => navigate("next")}
        disabled={total === 0}
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}