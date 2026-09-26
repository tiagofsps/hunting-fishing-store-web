export type CatalogSort = 'default' | 'price-asc' | 'price-desc' | 'name';

export interface CatalogQuery {
  page: number;
  size: number;
  categoryId: number | null;
  brandId: number | null;
  q: string;
  sort: CatalogSort;
}

/** Backend-supported sort fields (price sorting happens client-side per page). */
export type ServerSort = 'name' | 'createdAt';
export type SortDirection = 'asc' | 'desc';