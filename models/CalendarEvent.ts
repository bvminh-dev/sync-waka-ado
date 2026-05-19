import mongoose, { Schema, models, type Model } from "mongoose";

export interface ICalendarEvent {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  graphId: string;
  subject: string;
  bodyPreview?: string | null;
  start: Date;
  end: Date;
  isAllDay: boolean;
  location?: string | null;
  organizer?: string | null;
  attendees?: string[];
  showAs?: string | null;
  webLink?: string | null;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    graphId: { type: String, required: true },
    subject: { type: String, default: "" },
    bodyPreview: { type: String, default: null },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    isAllDay: { type: Boolean, default: false },
    location: { type: String, default: null },
    organizer: { type: String, default: null },
    attendees: { type: [String], default: [] },
    showAs: { type: String, default: null },
    webLink: { type: String, default: null },
    fetchedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

CalendarEventSchema.index({ employeeId: 1, graphId: 1 }, { unique: true });
CalendarEventSchema.index({ employeeId: 1, start: 1 });
CalendarEventSchema.index({ start: 1 });

if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as Record<string, unknown>).CalendarEvent;
  delete (mongoose.connection.models as Record<string, unknown>).CalendarEvent;
}

export const CalendarEvent: Model<ICalendarEvent> =
  (models.CalendarEvent as Model<ICalendarEvent>) ||
  mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);
