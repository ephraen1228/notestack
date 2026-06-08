"use client";

import { Textarea } from "@/components/ui/textarea";

interface NoteEditorProps {
  title: string;
  body: string;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
}

export function NoteEditor({
  title,
  body,
  onTitleChange,
  onBodyChange,
  titlePlaceholder = "Note title...",
  bodyPlaceholder = "Start writing...",
}: NoteEditorProps) {
  return (
    <div className="space-y-1">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={titlePlaceholder}
        className="w-full bg-transparent text-3xl font-semibold placeholder:text-muted-foreground/50 focus:outline-none ring-0 border-0 px-0 py-2"
      />
      <Textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder={bodyPlaceholder}
        className="min-h-[60vh] resize-none border-0 bg-transparent text-base leading-relaxed placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
      />
    </div>
  );
}
