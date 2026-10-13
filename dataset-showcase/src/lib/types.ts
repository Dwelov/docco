export type ColumnType = "numeric" | "categorical" | "boolean" | "date" | "text";

export interface ColumnStats {
  min?: number;
  max?: number;
  mean?: number;
  bins?: number[];
  top?: { value: string; pct: number }[];
}

export interface Column {
  name: string;
  type: ColumnType;
  description?: string;
  stats?: ColumnStats;
}

export interface Property {
  key: string;
  value: string;
}

export interface Dataset {
  id: string;
  title: string;
  description?: string;
  properties: Property[];
  columns: Column[];
  preview_rows: string[][];
  row_count: number;
  column_count: number;
  file_url?: string;
  file_path?: string;
  file_size_bytes?: number;
  position: number;
  created_at: string;
  updated_at: string;
}
