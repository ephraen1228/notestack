"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileText, MoreVertical, Pin, PinOff, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { getNoteColorStyle, stripHtml } from "@/lib/note-utils";
import type { Note } from "@/types/note";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onPin?: (id: string, pinned: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function NoteCard({ note, onPin, onDelete }: NoteCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const plainBody = stripHtml(note.body);
  const preview =
    plainBody.length > 100 ? plainBody.slice(0, 100) + "..." : plainBody;

  const timeAgo = formatDistanceToNow(new Date(note.updated_at), {
    addSuffix: true,
  });

  const colorStyle = getNoteColorStyle(note.color);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(note.id);
    setDeleting(false);
    setDeleteOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          "group relative rounded-lg border p-4 sm:p-5 transition-all duration-200",
          "hover:shadow-md hover:-translate-y-0.5",
          note.is_pinned && "ring-1 ring-primary/30"
        )}
        style={{
          background: colorStyle.background,
          borderColor: colorStyle.border,
        }}
      >
        {note.is_pinned && (
          <Pin className="absolute top-3 left-3 h-3.5 w-3.5 text-primary fill-primary" />
        )}

        <div
          className={cn(
            "absolute top-2 right-2 z-10 transition-opacity",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100",
            menuOpen && "opacity-100"
          )}
        >
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/60 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Note options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {onPin && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onPin(note.id, !note.is_pinned);
                    setMenuOpen(false);
                  }}
                >
                  {note.is_pinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin to top
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <a
          href={`/notes/${note.id}`}
          className="block min-w-0"
          style={{ paddingLeft: note.is_pinned ? "1.25rem" : undefined }}
        >
          <div className="flex items-start gap-3 pr-8">
            <FileText className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate group-hover:text-foreground transition-colors">
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
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
