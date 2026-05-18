import mongoose, { Schema, models, type Model } from "mongoose";
import type { EncString } from "@/lib/crypto";

export interface IEmployee {
  _id: mongoose.Types.ObjectId;
  name: string;
  authType: "api_key" | "oauth";
  apiKey?: EncString | null;
  clientId?: EncString | null;
  clientSecret?: EncString | null;
  accessToken?: EncString | null;
  refreshToken?: EncString | null;
  tokenExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const EncStringSchema = new Schema<EncString>(
  {
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    ct: { type: String, required: true },
  },
  { _id: false },
);

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    authType: {
      type: String,
      enum: ["api_key", "oauth"],
      required: true,
    },
    apiKey: { type: EncStringSchema, default: null },
    clientId: { type: EncStringSchema, default: null },
    clientSecret: { type: EncStringSchema, default: null },
    accessToken: { type: EncStringSchema, default: null },
    refreshToken: { type: EncStringSchema, default: null },
    tokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Employee: Model<IEmployee> =
  (models.Employee as Model<IEmployee>) ||
  mongoose.model<IEmployee>("Employee", EmployeeSchema);
