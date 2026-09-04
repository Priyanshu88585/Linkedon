export interface SearchQuery {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchFilters {
  company?: string;
  jobTitle?: string;
  location?: string;
  country?: string;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  listId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface SearchHistory {
  _id: string;
  userId: string;
  workspaceId: string;
  query: string;
  filters?: SearchFilters;
  resultCount?: number;
  createdAt: Date;
}

export interface SavedSearch {
  _id: string;
  workspaceId: string;
  userId: string;
  name: string;
  query: SearchQuery;
  createdAt: Date;
}
