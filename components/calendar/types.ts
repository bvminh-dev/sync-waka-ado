export interface CalEvent {
  _id: string;
  employeeId: string;
  employeeName: string;
  subject: string;
  bodyPreview?: string | null;
  start: string; // ISO
  end: string;
  isAllDay: boolean;
  location?: string | null;
  organizer?: string | null;
  showAs?: string | null;
  webLink?: string | null;
}

export interface CalEmployee {
  _id: string;
  name: string;
  email: string | null;
}

export type CalendarView = "month" | "week" | "day" | "agenda";
