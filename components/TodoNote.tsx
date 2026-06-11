"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Trash2, Star, Calendar, Bell, ChevronDown, ChevronRight,
  CheckSquare, Square, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TodoItem } from "@/types/note";

interface TodoNoteProps {
  noteId: string;
  isLight?: boolean;
}

export function TodoNote({ noteId, isLight }: TodoNoteProps) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("todo_items")
      .select("*")
      .eq("note_id", noteId)
      .order("position", { ascending: true });
    if (data) setItems(data as TodoItem[]);
    setLoading(false);
  }, [noteId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (parentId?: string) => {
    const text = parentId ? "" : newText.trim();
    if (!parentId && !text) return;

    const supabase = createClient();
    const maxPos = items.filter(i => i.parent_id === (parentId || null)).length;
    const { data } = await supabase
      .from("todo_items")
      .insert({
        note_id: noteId,
        parent_id: parentId || null,
        content: text || "Sub-task",
        position: maxPos,
      })
      .select()
      .single();

    if (data) {
      setItems((prev) => [...prev, data as TodoItem]);
      if (!parentId) setNewText("");
      if (parentId)
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.add(parentId);
          return next;
        });
    }
  };

  const updateItem = async (id: string, changes: Partial<TodoItem>) => {
    const supabase = createClient();
    await supabase.from("todo_items").update(changes).eq("id", id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
  };

  const deleteItem = async (id: string) => {
    const supabase = createClient();
    await supabase.from("todo_items").delete().eq("id", id);
    // Also delete children
    setItems((prev) => prev.filter((item) => item.id !== id && item.parent_id !== id));
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const canCompleteParent = (parentId: string) => {
    const children = items.filter((i) => i.parent_id === parentId);
    return children.length === 0 || children.every((c) => c.is_completed);
  };

  const rootItems = items.filter((i) => !i.parent_id);
  const textColor = isLight ? "text-gray-700" : "text-foreground";
  const mutedColor = isLight ? "text-gray-500" : "text-muted-foreground";
  const inputBg = isLight ? "bg-white/60 border-gray-300" : "bg-background";

  const renderItem = (item: TodoItem, depth = 0) => {
    const children = items.filter((c) => c.parent_id === item.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(item.id);
    const canComplete = !hasChildren || canCompleteParent(item.id);

    return (
      <div key={item.id} className={cn("select-none", depth > 0 && "ml-6")}>
        <div
          className={cn(
            "group flex items-start gap-2 rounded-lg px-2 py-1.5 transition-colors",
            item.is_completed && "opacity-60"
          )}
        >
          {/* Expand/collapse */}
          {depth === 0 && (
            <button
              type="button"
              onClick={() => toggleExpanded(item.id)}
              className={cn("mt-0.5 shrink-0", mutedColor)}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )
              ) : (
                <span className="w-4 inline-block" />
              )}
            </button>
          )}

          {/* Checkbox */}
          <button
            type="button"
            onClick={() => {
              if (!item.is_completed && !canComplete) return;
              updateItem(item.id, { is_completed: !item.is_completed });
            }}
            className={cn(
              "mt-0.5 shrink-0",
              item.is_completed ? "text-primary" : mutedColor,
              !canComplete && "opacity-40 cursor-not-allowed"
            )}
            title={!canComplete ? "Complete all sub-tasks first" : undefined}
          >
            {item.is_completed ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <input
              value={item.content}
              onChange={(e) => updateItem(item.id, { content: e.target.value })}
              className={cn(
                "w-full bg-transparent border-none outline-none text-sm",
                textColor,
                item.is_completed && "line-through"
              )}
            />
            <div className="flex gap-3 mt-0.5">
              {item.due_date && (
                <span className={cn("text-[10px] flex items-center gap-0.5", mutedColor)}>
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(item.due_date).toLocaleDateString()}
                </span>
              )}
              {item.alarm_at && (
                <span className={cn("text-[10px] flex items-center gap-0.5", mutedColor)}>
                  <Bell className="h-2.5 w-2.5" />
                  {new Date(item.alarm_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {item.is_important && (
                <span className="text-[10px] text-yellow-500 flex items-center gap-0.5">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Important
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => updateItem(item.id, { is_important: !item.is_important })}
              className={cn(
                "h-6 w-6 flex items-center justify-center rounded hover:bg-black/10",
                item.is_important ? "text-yellow-500" : mutedColor
              )}
            >
              <Star className="h-3 w-3" fill={item.is_important ? "currentColor" : "none"} />
            </button>

            {depth === 0 && (
              <>
                {/* Date picker */}
                <label className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-black/10 cursor-pointer", mutedColor)}>
                  <Calendar className="h-3 w-3" />
                  <input
                    type="date"
                    className="sr-only"
                    onChange={(e) =>
                      updateItem(item.id, {
                        due_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </label>
                {/* Alarm picker */}
                <label className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-black/10 cursor-pointer", mutedColor)}>
                  <Bell className="h-3 w-3" />
                  <input
                    type="datetime-local"
                    className="sr-only"
                    onChange={(e) =>
                      updateItem(item.id, {
                        alarm_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </label>
                {/* Add subtask */}
                <button
                  type="button"
                  onClick={() => addItem(item.id)}
                  className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-black/10", mutedColor)}
                  title="Add sub-task"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => deleteItem(item.id)}
              className={cn("h-6 w-6 flex items-center justify-center rounded hover:bg-red-100 hover:text-red-500", mutedColor)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-dashed border-muted-foreground/30 pl-2">
            {children.map((child) => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className={cn("p-4 text-sm", mutedColor)}>Loading tasks...</div>;
  }

  const completed = items.filter((i) => !i.parent_id && i.is_completed).length;
  const total = rootItems.length;

  return (
    <div className="space-y-2 py-4">
      {/* Progress */}
      {total > 0 && (
        <div className={cn("flex items-center gap-2 px-2 mb-4", mutedColor)}>
          <div className="flex-1 h-1.5 rounded-full bg-current opacity-20 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(completed / total) * 100}%`, opacity: 1 }}
            />
          </div>
          <span className="text-xs">
            {completed}/{total} done
          </span>
        </div>
      )}

      {/* Items */}
      {rootItems.length === 0 && (
        <p className={cn("text-sm text-center py-8", mutedColor)}>
          No tasks yet. Add one below!
        </p>
      )}
      <div className="space-y-0.5">
        {rootItems.map((item) => renderItem(item))}
      </div>

      {/* Add new */}
      <div className="flex items-center gap-2 pt-2">
        <Input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addItem();
          }}
          placeholder="Add a task..."
          className={cn("h-9 text-sm", inputBg)}
        />
        <Button
          type="button"
          size="sm"
          onClick={() => addItem()}
          disabled={!newText.trim()}
          className="h-9 shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}