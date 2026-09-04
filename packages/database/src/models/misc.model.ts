import mongoose, { Schema, Document, Model } from "mongoose";

// ─── List Model ────────────────────────────────────────────────────────────────

export interface ListDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  contactCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ListSchema = new Schema<ListDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    color: { type: String, default: "#7C3AED" },
    contactCount: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

ListSchema.index({ workspaceId: 1, createdAt: -1 });

// ─── List Member Model ─────────────────────────────────────────────────────────

export interface ListMemberDocument extends Document {
  listId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
}

const ListMemberSchema = new Schema<ListMemberDocument>(
  {
    listId: {
      type: Schema.Types.ObjectId,
      ref: "List",
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

// A contact can only appear once per list
ListMemberSchema.index({ listId: 1, contactId: 1 }, { unique: true });

// ─── Search History ────────────────────────────────────────────────────────────

export interface SearchHistoryDocument extends Document {
  userId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  query: string;
  filters?: Record<string, unknown>;
  resultCount?: number;
  createdAt: Date;
}

const SearchHistorySchema = new Schema<SearchHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    query: { type: String, required: true },
    filters: { type: Schema.Types.Mixed },
    resultCount: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

SearchHistorySchema.index({ userId: 1, createdAt: -1 });
// Auto-delete search history after 30 days
SearchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

// ─── Extension Session ─────────────────────────────────────────────────────────

export interface ExtensionSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const ExtensionSessionSchema = new Schema<ExtensionSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true, select: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false }
);

ExtensionSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ListModel: Model<ListDocument> =
  mongoose.models.List || mongoose.model<ListDocument>("List", ListSchema);

export const ListMemberModel: Model<ListMemberDocument> =
  mongoose.models.ListMember ||
  mongoose.model<ListMemberDocument>("ListMember", ListMemberSchema);

export const SearchHistoryModel: Model<SearchHistoryDocument> =
  mongoose.models.SearchHistory ||
  mongoose.model<SearchHistoryDocument>("SearchHistory", SearchHistorySchema);

export const ExtensionSessionModel: Model<ExtensionSessionDocument> =
  mongoose.models.ExtensionSession ||
  mongoose.model<ExtensionSessionDocument>("ExtensionSession", ExtensionSessionSchema);
