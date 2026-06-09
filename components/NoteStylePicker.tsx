"use client";

import { useState } from "react";
import { LayoutTemplate, Check, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NOTE_STYLE_CATEGORIES, getNoteStyleTemplate } from "@/lib/note-utils";
import { cn } from "@/lib/utils";

interface NoteStylePickerProps {
  currentStyle: string;
  onApplyToNote: (style: string, template: string | null) => void;
  onApplyToAll: (style: string) => void;
}

export function NoteStylePicker({
  currentStyle,
  onApplyToNote,
  onApplyToAll,
}: NoteStylePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(currentStyle);

  const handleApply = (applyToAll: boolean) => {
    const template = getNoteStyleTemplate(selectedStyle);
    if (applyToAll) {
      onApplyToAll(selectedStyle);
    } else {
      onApplyToNote(selectedStyle, template);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          title="Note style"
        >
          <LayoutTemplate className="h-4 w-4" />
          <span className="hidden sm:inline text-xs">Style</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Note Style</p>
          <p className="text-xs text-muted-foreground">
            Choose a background or template
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto p-2 space-y-3">
          {NOTE_STYLE_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="text-xs font-semibold text-muted-foreground px-1 mb-1">
                {cat.label}
              </p>
              <div className="grid grid-cols-2 gap-1">
                {cat.styles.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedStyle(s.value)}
                    className={cn(
                      "text-left text-xs px-2 py-1.5 rounded border transition-colors",
                      selectedStyle === s.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent hover:border-border hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-1">
                      {selectedStyle === s.value && (
                        <Check className="h-3 w-3 shrink-0" />
                      )}
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1"
            onClick={() => handleApply(false)}
          >
            <FileText className="h-3.5 w-3.5" />
            This Note
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1"
            onClick={() => handleApply(true)}
          >
            <Globe className="h-3.5 w-3.5" />
            All Notes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}