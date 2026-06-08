export type Note = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  color: string | null;
  is_pinned: boolean;
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
  | "purple";
