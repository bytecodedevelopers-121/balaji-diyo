export interface PageListQuery {
  page?: string;
  perPage?: string;
  search?: string;
}

export interface PageListAdminQuery extends PageListQuery {
  isActive?: boolean;
}
