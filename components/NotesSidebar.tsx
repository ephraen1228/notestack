"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  Pin,
  PinOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

interface NotesSidebarProps {
  notes: Note[];
  currentId: string;
  onPin: (id: string, pinned: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotesSidebar({
  notes,
  currentId,
  onPin,
  onDelete,
}: NotesSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const others = notes.filter((n) => n.id !== currentId);

  if (others.length === 0) return null;

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await onDelete(deleteId);
    setDeleting(false);
    setDeleteId(null);
  };

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-l border-border bg-muted/20 transition-all duration-200",
          collapsed ? "w-12" : "w-72"
        )}
      >
        <div className="flex items-center justify-between px-3 h-14 border-b border-border shrink-0">
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground">
              Other notes
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {others.map((note) => {
              const colorStyle = getNoteColorStyle(note.color);
              const preview = stripHtml(note.body).slice(0, 60);
              const timeAgo = formatDistanceToNow(new Date(note.updated_at), {
                addSuffix: true,
              });

              return (
                <div
                  key={note.id}
                  className="group relative rounded-lg border p-3 transition-all hover:shadow-sm"
                  style={{
                    background: colorStyle.background,
                    borderColor: colorStyle.border,
                  }}
                >
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPin(note.id, !note.is_pinned)}
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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(note.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <a href={`/notes/${note.id}`} className="block pr-6">
                    <p className="font-medium text-sm truncate">{note.title}</p>
                    {preview && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {preview}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                      {timeAgo}
                    </p>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
