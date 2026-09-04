import { Contact } from "./contact";

export interface List {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  contactCount: number;
  color?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListMember {
  _id: string;
  listId: string;
  contactId: string;
  addedBy: string;
  addedAt: Date;
  contact?: Contact;
}

export interface CreateListInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateListInput {
  name?: string;
  description?: string;
  color?: string;
}
