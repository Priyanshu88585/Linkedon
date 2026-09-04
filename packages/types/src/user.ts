import { UserRole, UserStatus } from "./enums";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  workspaceIds: string[];
  currentWorkspaceId?: string;
  emailVerified: boolean;
  status: UserStatus;
  onboardingCompleted: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends Omit<User, "workspaceIds"> {
  workspaces: { _id: string; name: string; role: string }[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
