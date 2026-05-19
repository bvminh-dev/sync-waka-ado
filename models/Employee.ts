import mongoose, { Schema, models, type Model } from "mongoose";
import type { EncString } from "@/lib/crypto";

export interface IEmployee {
  _id: mongoose.Types.ObjectId;
  name: string;
  authType?: "api_key" | "oauth" | null;
  apiKey?: EncString | null;
  clientId?: EncString | null;
  clientSecret?: EncString | null;
  accessToken?: EncString | null;
  refreshToken?: EncString | null;
  tokenExpiresAt?: Date | null;
  // Azure DevOps integration
  adoPat?: EncString | null;
  adoOrganization?: string | null;
  adoProject?: string | null;
  adoEmail?: string | null;
  adoEnabled?: boolean;
  adoWorkItemTypes?: string[];
  // Outlook Calendar integration
  outlookEnabled?: boolean;
  outlookAuthType?: "global" | "custom" | null;
  outlookClientId?: EncString | null;
  outlookClientSecret?: EncString | null;
  outlookTenantId?: string | null;
  outlookAccessToken?: EncString | null;
  outlookRefreshToken?: EncString | null;
  outlookTokenExpiresAt?: Date | null;
  outlookEmail?: string | null;
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
      enum: ["api_key", "oauth", null],
      default: null,
    },
    apiKey: { type: EncStringSchema, default: null },
    clientId: { type: EncStringSchema, default: null },
    clientSecret: { type: EncStringSchema, default: null },
    accessToken: { type: EncStringSchema, default: null },
    refreshToken: { type: EncStringSchema, default: null },
    tokenExpiresAt: { type: Date, default: null },
    // Azure DevOps integration
    adoPat: { type: EncStringSchema, default: null },
    adoOrganization: { type: String, default: null, trim: true },
    adoProject: { type: String, default: null, trim: true },
    adoEmail: { type: String, default: null, trim: true },
    adoEnabled: { type: Boolean, default: false },
    adoWorkItemTypes: { type: [String], default: [] },
    // Outlook Calendar integration
    outlookEnabled: { type: Boolean, default: false },
    outlookAuthType: {
      type: String,
      enum: ["global", "custom", null],
      default: null,
    },
    outlookClientId: { type: EncStringSchema, default: null },
    outlookClientSecret: { type: EncStringSchema, default: null },
    outlookTenantId: { type: String, default: null, trim: true },
    outlookAccessToken: { type: EncStringSchema, default: null },
    outlookRefreshToken: { type: EncStringSchema, default: null },
    outlookTokenExpiresAt: { type: Date, default: null },
    outlookEmail: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

// In development, always recreate the model to pick up schema changes
if (process.env.NODE_ENV === "development") {
  delete (mongoose.models as any).Employee;
  delete (mongoose.connection.models as any).Employee;
}

export const Employee: Model<IEmployee> =
  mongoose.model<IEmployee>("Employee", EmployeeSchema);
