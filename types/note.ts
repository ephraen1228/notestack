export type Note = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  color: string | null;
  is_pinned: boolean;
  is_favorite: boolean;
  note_style: string;
  note_type: "note" | "todo";
  note_order: number;
  created_at: string;
  updated_at: string;
};

export type NoteColor =
  | "default"
  | "rose"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "light-pink"
  | "light-peach"
  | "light-yellow"
  | "light-mint"
  | "light-sky"
  | "light-lavender"
  | "light-cream"
  | "light-sage";

export type NoteStyle = string;

export type TodoItem = {
  id: string;
  note_id: string;
  parent_id: string | null;
  content: string;
  is_completed: boolean;
  is_important: boolean;
  due_date: string | null;
  alarm_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  children?: TodoItem[];
};