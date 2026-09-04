import mongoose, { Schema, Document, Model } from "mongoose";
import { ContactVerificationStatus } from "@linkedon/types";

const ContactEmailSchema = new Schema(
  {
    value: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: Object.values(ContactVerificationStatus),
      default: ContactVerificationStatus.UNVERIFIED,
    },
    isPrimary: { type: Boolean, default: false },
    source: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    verifiedAt: { type: Date },
  },
  { _id: false }
);

const ContactPhoneSchema = new Schema(
  {
    value: { type: String, required: true, trim: true }, // E.164 format
    formatted: { type: String },
    type: { type: String, enum: ["mobile", "direct", "work", "unknown"], default: "unknown" },
    status: {
      type: String,
      enum: Object.values(ContactVerificationStatus),
      default: ContactVerificationStatus.UNVERIFIED,
    },
    isPrimary: { type: Boolean, default: false },
    source: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
  },
  { _id: false }
);

const SocialProfileSchema = new Schema(
  {
    platform: {
      type: String,
      enum: ["linkedin", "github", "twitter", "facebook", "instagram", "other"],
      required: true,
    },
    url: { type: String, required: true },
    username: { type: String },
  },
  { _id: false }
);

const ContactSourceSchema = new Schema(
  {
    provider: { type: String, required: true },
    retrievedAt: { type: Date, default: Date.now },
    inputUrl: { type: String },
    rawData: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

export interface ContactDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  jobTitle?: string;
  company?: string;
  companyDomain?: string;
  location?: string;
  country?: string;
  city?: string;
  emails: typeof ContactEmailSchema[];
  phones: typeof ContactPhoneSchema[];
  socialProfiles: typeof SocialProfileSchema[];
  sources: typeof ContactSourceSchema[];
  tags: string[];
  confidence: number;
  verificationStatus: ContactVerificationStatus;
  listIds: mongoose.Types.ObjectId[];
  enrichmentIds: mongoose.Types.ObjectId[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<ContactDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    fullName: { type: String, trim: true, index: true },
    jobTitle: { type: String, trim: true },
    company: { type: String, trim: true, index: true },
    companyDomain: { type: String, lowercase: true, trim: true, index: true },
    location: { type: String, trim: true },
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    emails: [ContactEmailSchema],
    phones: [ContactPhoneSchema],
    socialProfiles: [SocialProfileSchema],
    sources: [ContactSourceSchema],
    tags: [{ type: String, trim: true }],
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    verificationStatus: {
      type: String,
      enum: Object.values(ContactVerificationStatus),
      default: ContactVerificationStatus.UNVERIFIED,
    },
    listIds: [{ type: Schema.Types.ObjectId, ref: "List" }],
    enrichmentIds: [{ type: Schema.Types.ObjectId, ref: "Enrichment" }],
    notes: { type: String },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
ContactSchema.index({ workspaceId: 1, createdAt: -1 });
ContactSchema.index({ workspaceId: 1, company: 1 });
ContactSchema.index({ workspaceId: 1, companyDomain: 1 });
ContactSchema.index({ workspaceId: 1, fullName: "text", jobTitle: "text", company: "text" });
ContactSchema.index({ "emails.value": 1 });
ContactSchema.index({ listIds: 1 });
ContactSchema.index({ tags: 1 });

export const ContactModel: Model<ContactDocument> =
  mongoose.models.Contact ||
  mongoose.model<ContactDocument>("Contact", ContactSchema);
