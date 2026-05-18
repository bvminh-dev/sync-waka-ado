import mongoose, { Schema, models, type Model } from "mongoose";

export interface IAdoWorkItemCache {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  workItemId: number;
  url: string;
  title: string;
  state: string;
  type: string;
  assignedDate?: Date;
  remainingWork?: number | null;
  completedWork?: number | null;
  rev: number;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdoWorkItemCacheSchema = new Schema<IAdoWorkItemCache>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    workItemId: { type: Number, required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    state: { type: String, required: true },
    type: { type: String, required: true },
    assignedDate: { type: Date, default: null },
    remainingWork: { type: Number, default: null },
    completedWork: { type: Number, default: null },
    rev: { type: Number, required: true },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Create compound indexes
AdoWorkItemCacheSchema.index({ employeeId: 1, workItemId: 1 });
AdoWorkItemCacheSchema.index({ employeeId: 1, state: 1 });
AdoWorkItemCacheSchema.index({ employeeId: 1, type: 1 });
AdoWorkItemCacheSchema.index({ fetchedAt: 1 });

// In development, always recreate the model to pick up schema changes
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).AdoWorkItemCache;
  delete (mongoose.connection.models as any).AdoWorkItemCache;
}

export const AdoWorkItemCache: Model<IAdoWorkItemCache> =
  mongoose.model<IAdoWorkItemCache>("AdoWorkItemCache", AdoWorkItemCacheSchema);
