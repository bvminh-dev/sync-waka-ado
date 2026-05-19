import mongoose, { Schema, models, type Model } from "mongoose";

export interface IBranch {
  name: string;
  totalSeconds: number;
  adoWorkItemId?: number | null;
}
export interface IProject {
  name: string;
  totalSeconds: number;
  branches: IBranch[];
}
export interface IDailySummary {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: string;
  totalSeconds: number;
  projects: IProject[];
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    totalSeconds: { type: Number, required: true, default: 0 },
    adoWorkItemId: { type: Number, default: null },
  },
  { _id: false },
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    totalSeconds: { type: Number, required: true, default: 0 },
    branches: { type: [BranchSchema], default: [] },
  },
  { _id: false },
);

const DailySummarySchema = new Schema<IDailySummary>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    totalSeconds: { type: Number, required: true, default: 0 },
    projects: { type: [ProjectSchema], default: [] },
    fetchedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

DailySummarySchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const DailySummary: Model<IDailySummary> =
  (models.DailySummary as Model<IDailySummary>) ||
  mongoose.model<IDailySummary>("DailySummary", DailySummarySchema);
