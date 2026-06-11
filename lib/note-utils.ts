import type React from "react";
import type { NoteColor } from "@/types/note";

export const NOTE_COLORS: { value: NoteColor; label: string; swatch: string; isLight?: boolean }[] = [
  // Dark Colors
  { value: "default", label: "Default Dark", swatch: "hsl(222 47% 8%)" },
  { value: "rose", label: "Dark Rose", swatch: "hsl(350 35% 14%)" },
  { value: "orange", label: "Dark Orange", swatch: "hsl(25 40% 13%)" },
  { value: "amber", label: "Dark Amber", swatch: "hsl(40 45% 12%)" },
  { value: "green", label: "Dark Green", swatch: "hsl(145 30% 12%)" },
  { value: "teal", label: "Dark Teal", swatch: "hsl(175 30% 12%)" },
  { value: "blue", label: "Dark Blue", swatch: "hsl(215 35% 13%)" },
  { value: "purple", label: "Dark Purple", swatch: "hsl(270 30% 14%)" },
  // Light Colors
  { value: "light-pink", label: "Pink", swatch: "hsl(350 80% 94%)", isLight: true },
  { value: "light-peach", label: "Peach", swatch: "hsl(25 90% 92%)", isLight: true },
  { value: "light-yellow", label: "Yellow", swatch: "hsl(50 95% 91%)", isLight: true },
  { value: "light-mint", label: "Mint", swatch: "hsl(145 60% 90%)", isLight: true },
  { value: "light-sky", label: "Sky Blue", swatch: "hsl(200 80% 90%)", isLight: true },
  { value: "light-lavender", label: "Lavender", swatch: "hsl(270 60% 92%)", isLight: true },
  { value: "light-cream", label: "Cream", swatch: "hsl(40 60% 94%)", isLight: true },
  { value: "light-sage", label: "Sage", swatch: "hsl(130 30% 88%)", isLight: true },
];

const NOTE_COLOR_STYLES: Record<NoteColor, { background: string; border: string; isLight?: boolean }> = {
  default: { background: "hsl(222 47% 8%)", border: "hsl(217 33% 18%)" },
  rose: { background: "hsl(350 35% 14%)", border: "hsl(350 30% 24%)" },
  orange: { background: "hsl(25 40% 13%)", border: "hsl(25 35% 22%)" },
  amber: { background: "hsl(40 45% 12%)", border: "hsl(40 40% 20%)" },
  green: { background: "hsl(145 30% 12%)", border: "hsl(145 28% 20%)" },
  teal: { background: "hsl(175 30% 12%)", border: "hsl(175 28% 20%)" },
  blue: { background: "hsl(215 35% 13%)", border: "hsl(215 30% 22%)" },
  purple: { background: "hsl(270 30% 14%)", border: "hsl(270 28% 22%)" },
  // Light Colors
  "light-pink": { background: "hsl(350 80% 97%)", border: "hsl(350 50% 88%)", isLight: true },
  "light-peach": { background: "hsl(25 90% 96%)", border: "hsl(25 60% 85%)", isLight: true },
  "light-yellow": { background: "hsl(50 95% 95%)", border: "hsl(50 70% 80%)", isLight: true },
  "light-mint": { background: "hsl(145 60% 95%)", border: "hsl(145 40% 82%)", isLight: true },
  "light-sky": { background: "hsl(200 80% 96%)", border: "hsl(200 55% 83%)", isLight: true },
  "light-lavender": { background: "hsl(270 60% 96%)", border: "hsl(270 40% 84%)", isLight: true },
  "light-cream": { background: "hsl(40 60% 97%)", border: "hsl(40 40% 85%)", isLight: true },
  "light-sage": { background: "hsl(130 30% 94%)", border: "hsl(130 25% 80%)", isLight: true },
};

export function getNoteColorStyle(color: string | null | undefined) {
  const key = (color as NoteColor) || "default";
  return NOTE_COLOR_STYLES[key] ?? NOTE_COLOR_STYLES.default;
}

export function isLightColor(color: string | null | undefined): boolean {
  const key = (color as NoteColor) || "default";
  return NOTE_COLOR_STYLES[key]?.isLight ?? false;
}

export function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("script, style").forEach((el) => el.remove());
  return (div.textContent || div.innerText || "").trim();
}

export function sortNotes<T extends { is_pinned?: boolean; is_favorite?: boolean; note_order?: number; updated_at: string }>(
  notes: T[]
): T[] {
  return [...notes].sort((a, b) => {
    const pinA = a.is_pinned ? 1 : 0;
    const pinB = b.is_pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    const orderA = a.note_order ?? 0;
    const orderB = b.note_order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

// ─── NOTE STYLE DEFINITIONS ─────────────────────────────────────────────────

export type NoteStyleCategory = {
  label: string;
  styles: { value: string; label: string }[];
};

export const NOTE_STYLE_CATEGORIES: NoteStyleCategory[] = [
  {
    label: "Basic",
    styles: [
      { value: "blank", label: "Blank Page" },
      { value: "lined", label: "Lined" },
      { value: "lined-narrow", label: "Lined (Narrow)" },
      { value: "lined-wide", label: "Lined (Wide)" },
      { value: "grid", label: "Grid" },
      { value: "grid-narrow", label: "Grid (Narrow)" },
      { value: "grid-wide", label: "Grid (Wide)" },
      { value: "dot", label: "Dot" },
      { value: "dot-narrow", label: "Dot (Narrow)" },
      { value: "dot-wide", label: "Dot (Wide)" },
    ],
  },
  {
    label: "Academic",
    styles: [
      { value: "notebook", label: "Notebook" },
      { value: "school-planner-1", label: "School Planner 1" },
      { value: "school-planner-2", label: "School Planner 2" },
      { value: "school-planner-3", label: "School Planner 3" },
      { value: "school-planner-4", label: "School Planner 4" },
      { value: "school-schedule", label: "School Schedule" },
    ],
  },
  {
    label: "Planners",
    styles: [
      { value: "monthly-planner", label: "Monthly Planner" },
      { value: "work-planner", label: "Work Planner" },
      { value: "health-planner", label: "Health Planner" },
      { value: "travel-plan", label: "Travel Plan" },
      { value: "monthly-budget", label: "Monthly Budget" },
    ],
  },
  {
    label: "Journals",
    styles: [
      { value: "daily-journal", label: "Daily Journal" },
      { value: "pet-care-log", label: "Pet Care Log" },
    ],
  },
  {
    label: "Creative",
    styles: [
      { value: "music", label: "Music" },
      { value: "recipes", label: "Recipes & Meal Plan" },
    ],
  },
  {
    label: "Custom",
    styles: [
      { value: "custom-bg", label: "Upload Image Background" },
    ],
  },
];

export function getNoteStyleCSS(style: string, isLight: boolean): React.CSSProperties {
  const lineColor = isLight
    ? "rgba(100, 120, 200, 0.2)"
    : "rgba(100, 132, 199, 0.2)";
  const dotColor = isLight
    ? "rgba(100, 120, 200, 0.3)"
    : "rgba(100, 132, 199, 0.3)";

  switch (style) {
    case "lined":
      return {
        backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, ${lineColor} 27px, ${lineColor} 28px)`,
        backgroundSize: "100% 28px",
        backgroundPosition: "0 8px",
      };
    case "lined-narrow":
      return {
        backgroundImage: `repeating-linear-gradient(transparent, transparent 19px, ${lineColor} 19px, ${lineColor} 20px)`,
        backgroundSize: "100% 20px",
        backgroundPosition: "0 8px",
      };
    case "lined-wide":
      return {
        backgroundImage: `repeating-linear-gradient(transparent, transparent 39px, ${lineColor} 39px, ${lineColor} 40px)`,
        backgroundSize: "100% 40px",
        backgroundPosition: "0 8px",
      };
    case "grid":
      return {
        backgroundImage: `repeating-linear-gradient(${lineColor} 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, ${lineColor} 0 1px, transparent 1px 100%)`,
        backgroundSize: "24px 24px",
      };
    case "grid-narrow":
      return {
        backgroundImage: `repeating-linear-gradient(${lineColor} 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, ${lineColor} 0 1px, transparent 1px 100%)`,
        backgroundSize: "14px 14px",
      };
    case "grid-wide":
      return {
        backgroundImage: `repeating-linear-gradient(${lineColor} 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, ${lineColor} 0 1px, transparent 1px 100%)`,
        backgroundSize: "40px 40px",
      };
    case "dot":
      return {
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
      };
    case "dot-narrow":
      return {
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: "12px 12px",
      };
    case "dot-wide":
      return {
        backgroundImage: `radial-gradient(circle, ${dotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: "32px 32px",
      };
    case "notebook":
      return {
        backgroundImage: `linear-gradient(90deg, transparent 60px, rgba(220,50,50,0.3) 60px, rgba(220,50,50,0.3) 61px, transparent 61px), repeating-linear-gradient(transparent, transparent 27px, ${lineColor} 27px, ${lineColor} 28px)`,
        backgroundSize: "100% 28px",
        backgroundPosition: "0 8px",
      };
    default:
      return {};
  }
}

export function getNoteStyleTemplate(style: string): string | null {
  const today = new Date();
  const month = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  switch (style) {
    case "school-planner-1":
      return `<h2>📅 Weekly School Planner</h2><p><strong>Week of:</strong> _______________</p><br><table border="1" cellpadding="8" style="width:100%;border-collapse:collapse"><tr><th>Day</th><th>Subject</th><th>Assignment</th><th>Due Date</th><th>Done</th></tr><tr><td>Monday</td><td></td><td></td><td></td><td>☐</td></tr><tr><td>Tuesday</td><td></td><td></td><td></td><td>☐</td></tr><tr><td>Wednesday</td><td></td><td></td><td></td><td>☐</td></tr><tr><td>Thursday</td><td></td><td></td><td></td><td>☐</td></tr><tr><td>Friday</td><td></td><td></td><td></td><td>☐</td></tr></table>`;
    case "school-planner-2":
      return `<h2>📚 Study Planner</h2><p><strong>Date:</strong> ${dateStr}</p><br><p><strong>Today's Goals:</strong></p><ul><li>Goal 1: </li><li>Goal 2: </li><li>Goal 3: </li></ul><br><p><strong>Subjects to Study:</strong></p><ol><li> </li><li> </li><li> </li></ol><br><p><strong>Notes & Reminders:</strong></p><p> </p>`;
    case "school-planner-3":
      return `<h2>🎓 Class Notes Organizer</h2><p><strong>Subject:</strong> _____________ | <strong>Date:</strong> _____________</p><hr><p><strong>Key Concepts:</strong></p><p> </p><br><p><strong>Important Points:</strong></p><ul><li> </li><li> </li><li> </li></ul><br><p><strong>Questions to Ask:</strong></p><p> </p><br><p><strong>Summary:</strong></p><p> </p>`;
    case "school-planner-4":
      return `<h2>📋 Project Planner</h2><p><strong>Project:</strong> _____________ | <strong>Due:</strong> _____________</p><br><p><strong>Team Members:</strong></p><p> </p><br><p><strong>Tasks Breakdown:</strong></p><ol><li>☐ </li><li>☐ </li><li>☐ </li><li>☐ </li></ol><br><p><strong>Resources Needed:</strong></p><p> </p><br><p><strong>Progress Notes:</strong></p><p> </p>`;
    case "school-schedule":
      return `<h2>🗓️ Class Schedule</h2><p><strong>Semester:</strong> _____________</p><br><table border="1" cellpadding="8" style="width:100%;border-collapse:collapse"><tr><th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th></tr><tr><td>8:00 AM</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>10:00 AM</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>12:00 PM</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2:00 PM</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4:00 PM</td><td></td><td></td><td></td><td></td><td></td></tr></table>`;
    case "monthly-planner":
      return `<h2>📅 ${month} ${year} — Monthly Planner</h2><br><table border="1" cellpadding="6" style="width:100%;border-collapse:collapse"><tr><th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr><tr><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td></tr><tr><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td></tr><tr><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td></tr><tr><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td><td style="height:70px;vertical-align:top"> </td></tr></table><br><p><strong>Goals this month:</strong></p><ul><li> </li><li> </li></ul>`;
    case "work-planner":
      return `<h2>💼 Work Planner — ${dateStr}</h2><br><p><strong>Top Priorities Today:</strong></p><ol><li>☐ </li><li>☐ </li><li>☐ </li></ol><br><p><strong>Meetings:</strong></p><ul><li> </li><li> </li></ul><br><p><strong>Deadlines:</strong></p><ul><li> </li><li> </li></ul><br><p><strong>Ideas & Notes:</strong></p><p> </p><br><p><strong>End of Day Review:</strong></p><p>Accomplished: </p><p>Carry forward: </p>`;
    case "health-planner":
      return `<h2>💪 Health Planner — ${dateStr}</h2><br><p><strong>Sleep:</strong> Bedtime ______ | Wake up ______ | Hours ______</p><br><p><strong>Water Intake:</strong> ☐ ☐ ☐ ☐ ☐ ☐ ☐ ☐ (glasses)</p><br><p><strong>Meals:</strong></p><ul><li>Breakfast: </li><li>Lunch: </li><li>Dinner: </li><li>Snacks: </li></ul><br><p><strong>Exercise:</strong></p><ul><li>Type: </li><li>Duration: </li><li>Notes: </li></ul><br><p><strong>Mood:</strong> ☐ Great ☐ Good ☐ Okay ☐ Low</p><br><p><strong>Notes:</strong></p><p> </p>`;
    case "travel-plan":
      return `<h2>✈️ Travel Plan</h2><p><strong>Destination:</strong> _____________</p><p><strong>Dates:</strong> _____________ to _____________</p><br><p><strong>Flights / Transport:</strong></p><p> </p><br><p><strong>Accommodation:</strong></p><p> </p><br><p><strong>Day-by-Day Itinerary:</strong></p><p><strong>Day 1:</strong> </p><p><strong>Day 2:</strong> </p><p><strong>Day 3:</strong> </p><br><p><strong>Packing List:</strong></p><ul><li>☐ </li><li>☐ </li><li>☐ </li></ul><br><p><strong>Budget:</strong></p><table border="1" cellpadding="6" style="width:100%;border-collapse:collapse"><tr><th>Item</th><th>Estimated</th><th>Actual</th></tr><tr><td>Flights</td><td></td><td></td></tr><tr><td>Hotel</td><td></td><td></td></tr><tr><td>Food</td><td></td><td></td></tr><tr><td>Activities</td><td></td><td></td></tr></table>`;
    case "monthly-budget":
      return `<h2>💰 Monthly Budget — ${month} ${year}</h2><br><p><strong>Total Income:</strong> $ ___________</p><br><p><strong>Fixed Expenses:</strong></p><table border="1" cellpadding="6" style="width:100%;border-collapse:collapse"><tr><th>Category</th><th>Budgeted</th><th>Actual</th></tr><tr><td>Rent / Mortgage</td><td></td><td></td></tr><tr><td>Utilities</td><td></td><td></td></tr><tr><td>Insurance</td><td></td><td></td></tr><tr><td>Subscriptions</td><td></td><td></td></tr></table><br><p><strong>Variable Expenses:</strong></p><table border="1" cellpadding="6" style="width:100%;border-collapse:collapse"><tr><th>Category</th><th>Budgeted</th><th>Actual</th></tr><tr><td>Groceries</td><td></td><td></td></tr><tr><td>Dining Out</td><td></td><td></td></tr><tr><td>Entertainment</td><td></td><td></td></tr><tr><td>Shopping</td><td></td><td></td></tr><tr><td>Other</td><td></td><td></td></tr></table><br><p><strong>Savings:</strong> $ ___________</p>`;
    case "daily-journal":
      return `<h2>📖 Daily Journal</h2><p><strong>${dateStr}</strong></p><br><p><strong>Today I am grateful for:</strong></p><ol><li> </li><li> </li><li> </li></ol><br><p><strong>How I'm feeling today:</strong></p><p> </p><br><p><strong>What happened today:</strong></p><p> </p><br><p><strong>What I learned:</strong></p><p> </p><br><p><strong>Tomorrow I want to:</strong></p><p> </p>`;
    case "pet-care-log":
      return `<h2>🐾 Pet Care Log</h2><p><strong>Pet Name:</strong> _____________ | <strong>Date:</strong> ${dateStr}</p><br><p><strong>Feeding:</strong></p><ul><li>Morning: ☐ | Amount: </li><li>Evening: ☐ | Amount: </li></ul><br><p><strong>Exercise / Walk:</strong></p><ul><li>Duration: </li><li>Activity: </li></ul><br><p><strong>Medication / Supplements:</strong></p><ul><li>☐ </li></ul><br><p><strong>Mood / Behavior:</strong></p><p> </p><br><p><strong>Notes / Vet Reminders:</strong></p><p> </p>`;
    case "music":
      return `<h2>🎵 Music Notes</h2><p><strong>Song / Piece:</strong> _____________</p><p><strong>Key:</strong> ______ | <strong>Tempo:</strong> ______ BPM | <strong>Time Signature:</strong> ______</p><br><p><strong>Chords / Progression:</strong></p><p> </p><br><p><strong>Lyrics / Notes:</strong></p><p> </p><br><p><strong>Structure (Verse, Chorus, Bridge):</strong></p><p> </p><br><p><strong>Practice Notes:</strong></p><p> </p>`;
    case "recipes":
      return `<h2>🍳 Recipe</h2><p><strong>Dish Name:</strong> _____________</p><p><strong>Prep Time:</strong> ______ | <strong>Cook Time:</strong> ______ | <strong>Servings:</strong> ______</p><br><p><strong>Ingredients:</strong></p><ul><li> </li><li> </li><li> </li><li> </li><li> </li></ul><br><p><strong>Instructions:</strong></p><ol><li> </li><li> </li><li> </li><li> </li></ol><br><p><strong>Tips & Variations:</strong></p><p> </p><br><p><strong>Meal Plan:</strong></p><table border="1" cellpadding="6" style="width:100%;border-collapse:collapse"><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Dinner</th></tr><tr><td>Monday</td><td></td><td></td><td></td></tr><tr><td>Tuesday</td><td></td><td></td><td></td></tr><tr><td>Wednesday</td><td></td><td></td><td></td></tr></table>`;
    default:
      return null;
  }
}