import type { NoteColor } from "@/types/note";

export const NOTE_COLORS: { value: NoteColor; label: string; swatch: string }[] = [
  { value: "default", label: "Default", swatch: "hsl(222 47% 8%)" },
  { value: "rose", label: "Rose", swatch: "hsl(350 35% 14%)" },
  { value: "orange", label: "Orange", swatch: "hsl(25 40% 13%)" },
  { value: "amber", label: "Amber", swatch: "hsl(40 45% 12%)" },
  { value: "green", label: "Green", swatch: "hsl(145 30% 12%)" },
  { value: "teal", label: "Teal", swatch: "hsl(175 30% 12%)" },
  { value: "blue", label: "Blue", swatch: "hsl(215 35% 13%)" },
  { value: "purple", label: "Purple", swatch: "hsl(270 30% 14%)" },
];

const NOTE_COLOR_STYLES: Record<
  NoteColor,
  { background: string; border: string }
> = {
  default: { background: "hsl(222 47% 8%)", border: "hsl(217 33% 18%)" },
  rose: { background: "hsl(350 35% 14%)", border: "hsl(350 30% 24%)" },
  orange: { background: "hsl(25 40% 13%)", border: "hsl(25 35% 22%)" },
  amber: { background: "hsl(40 45% 12%)", border: "hsl(40 40% 20%)" },
  green: { background: "hsl(145 30% 12%)", border: "hsl(145 28% 20%)" },
  teal: { background: "hsl(175 30% 12%)", border: "hsl(175 28% 20%)" },
  blue: { background: "hsl(215 35% 13%)", border: "hsl(215 30% 22%)" },
  purple: { background: "hsl(270 30% 14%)", border: "hsl(270 28% 22%)" },
};

export function getNoteColorStyle(color: string | null | undefined) {
  const key = (color as NoteColor) || "default";
  return NOTE_COLOR_STYLES[key] ?? NOTE_COLOR_STYLES.default;
}

export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

export function sortNotes<T extends { is_pinned?: boolean; updated_at: string }>(
  notes: T[]
): T[] {
  return [...notes].sort((a, b) => {
    const pinA = a.is_pinned ? 1 : 0;
    const pinB = b.is_pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}
