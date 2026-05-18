import mongoose, { Schema, models, type Model } from "mongoose";

export interface ITimeTrackingSession {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  adoWorkItemId: number;
  startedAt: Date;
  completedAt?: Date | null;
  completedWork?: number;
  adoRevision?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TimeTrackingSessionSchema = new Schema<ITimeTrackingSession>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    adoWorkItemId: { type: Number, required: true, index: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    completedWork: { type: Number, default: null },
    adoRevision: { type: Number, default: null },
  },
  { timestamps: true },
);

// Create compound index for active session queries
TimeTrackingSessionSchema.index({ employeeId: 1, completedAt: 1 });

// In development, always recreate the model to pick up schema changes
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).TimeTrackingSession;
  delete (mongoose.connection.models as any).TimeTrackingSession;
}

export const TimeTrackingSession: Model<ITimeTrackingSession> =
  mongoose.model<ITimeTrackingSession>("TimeTrackingSession", TimeTrackingSessionSchema);
