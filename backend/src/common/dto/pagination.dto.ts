export class PaginationMetaDto {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  constructor(params: { page: number; perPage: number; total: number }) {
    this.currentPage = params.page;
    this.perPage = params.perPage;
    this.total = params.total;
    this.totalPages = Math.ceil(params.total / params.perPage);
    this.hasNextPage = params.page < this.totalPages;
    this.hasPreviousPage = params.page > 1;
  }
}

export class PaginationDto<T> {
  items: T[];
  meta: PaginationMetaDto;

  constructor(items: T[], meta: PaginationMetaDto) {
    this.items = items;
    this.meta = meta;
  }

  static create<T>(params: {
    items: T[];
    page: number;
    perPage: number;
    total: number;
  }): PaginationDto<T> {
    const meta = new PaginationMetaDto({
      page: params.page,
      perPage: params.perPage,
      total: params.total,
    });
    return new PaginationDto<T>(params.items, meta);
  }
}

export class PaginationQueryDto {
  page: number;
  perPage: number;

  constructor(query: { page?: string | number; perPage?: string | number }) {
    this.page = Math.max(1, Number(query.page) || 1);
    this.perPage = Math.min(100, Math.max(1, Number(query.perPage) || 10));
  }

  get skip(): number {
    return (this.page - 1) * this.perPage;
  }

  get take(): number {
    return this.perPage;
  }
}