import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import type { Note } from "@/types/note";

export function NoteCard({ note }: { note: Note }) {
  const preview =
    note.body.length > 100 ? note.body.slice(0, 100) + "..." : note.body;

  const timeAgo = formatDistanceToNow(new Date(note.updated_at), {
    addSuffix: true,
  });

  return (
    <a
      href={`/notes/${note.id}`}
      className="group block rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-foreground/20 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        <FileText className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-card-foreground truncate group-hover:text-foreground transition-colors">
            {note.title}
          </h3>
          {preview && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {preview}
            </p>
          )}
          <p className="mt-2.5 text-xs text-muted-foreground/70">
            {timeAgo}
          </p>
        </div>
      </div>
    </a>
  );
}
