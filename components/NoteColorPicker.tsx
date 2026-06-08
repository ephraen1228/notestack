"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NOTE_COLORS } from "@/lib/note-utils";
import type { NoteColor } from "@/types/note";
import { cn } from "@/lib/utils";

interface NoteColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
  compact?: boolean;
}

export function NoteColorPicker({
  value,
  onChange,
  compact,
}: NoteColorPickerProps) {
  const current = (value as NoteColor) || "default";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn(compact ? "h-9 w-9" : "gap-1.5")}
          title="Note color"
        >
          <Palette className="h-4 w-4" />
          {!compact && <span className="hidden sm:inline">Color</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <p className="text-xs text-muted-foreground mb-2">Background color</p>
        <div className="grid grid-cols-4 gap-2">
          {NOTE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() =>
                onChange(c.value === "default" ? null : c.value)
              }
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                current === c.value
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent"
              )}
              style={{ background: c.swatch }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
