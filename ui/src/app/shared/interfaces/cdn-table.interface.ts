export type CdnTableSortDirection = 'asc' | 'desc' | '';
export interface CdnTableSort { active: string; direction: CdnTableSortDirection; }
export interface CdnTableColumn<T = any> { key: string; header: string; sortable?: boolean; formatter?: (row: T) => string | number | null | undefined; }
