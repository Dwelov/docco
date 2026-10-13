import type { Column, ColumnType, Dataset, Property } from "./types";

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 5000;
export const PREVIEW_CELL_MAX = 200;
export const PREVIEW_BUDGET_BYTES = 200 * 1024;

const COLUMN_TYPES: ColumnType[] = ["numeric", "categorical", "boolean", "date", "text"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Validate `properties` shape: [{ key, value }] string pairs. */
export function validateProperties(v: unknown): { ok: true; value: Property[] } | { ok: false; error: string } {
  if (!Array.isArray(v)) return { ok: false, error: "properties must be an array." };
  const out: Property[] = [];
  for (const item of v) {
    if (!isRecord(item) || typeof item.key !== "string" || typeof item.value !== "string") {
      return { ok: false, error: "Each property must be { key: string, value: string }." };
    }
    if (item.key.length > 100 || item.value.length > 500) {
      return { ok: false, error: "Property key (max 100) or value (max 500) too long." };
    }
    out.push({ key: item.key, value: item.value });
  }
  return { ok: true, value: out };
}

/** Validate `columns` shape: [{ name, type, description?, stats? }]. */
export function validateColumns(v: unknown): { ok: true; value: Column[] } | { ok: false; error: string } {
  if (!Array.isArray(v)) return { ok: false, error: "columns must be an array." };
  const out: Column[] = [];
  for (const item of v) {
    if (!isRecord(item) || typeof item.name !== "string" || item.name.length === 0) {
      return { ok: false, error: "Each column needs a non-empty string name." };
    }
    if (item.name.length > 200) return { ok: false, error: "Column name too long (max 200)." };
    if (typeof item.type !== "string" || !COLUMN_TYPES.includes(item.type as ColumnType)) {
      return { ok: false, error: `Column "${item.name}" has an invalid type.` };
    }
    const col: Column = { name: item.name, type: item.type as ColumnType };
    if (item.description !== undefined) {
      if (typeof item.description !== "string" || item.description.length > 500) {
        return { ok: false, error: "Column description must be a string (max 500)." };
      }
      col.description = item.description;
    }
    if (item.stats !== undefined) {
      if (!isRecord(item.stats)) return { ok: false, error: "Column stats must be an object." };
      col.stats = item.stats as Column["stats"];
    }
    out.push(col);
  }
  return { ok: true, value: out };
}

function byteSize(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Validate + enforce `preview_rows` budget: every cell coerced to a
 * string truncated to 200 chars, total kept under ~200 KB by dropping
 * trailing rows. Returns the cleaned rows or an error.
 */
export function cleanPreviewRows(
  v: unknown,
): { ok: true; value: string[][] } | { ok: false; error: string } {
  if (!Array.isArray(v)) return { ok: false, error: "preview_rows must be an array." };
  const rows: string[][] = [];
  for (const row of v) {
    if (!Array.isArray(row)) return { ok: false, error: "Each preview row must be an array." };
    rows.push(
      row.map((cell) => {
        const s = cell === null || cell === undefined ? "" : String(cell);
        return s.length > PREVIEW_CELL_MAX ? s.slice(0, PREVIEW_CELL_MAX) : s;
      }),
    );
  }
  let cleaned = rows;
  while (cleaned.length > 0 && byteSize(JSON.stringify(cleaned)) > PREVIEW_BUDGET_BYTES) {
    cleaned = cleaned.slice(0, -1);
  }
  if (rows.length > 0 && cleaned.length === 0) {
    return { ok: false, error: "Preview data too large even for a single row." };
  }
  return { ok: true, value: cleaned };
}

export interface DatasetInput {
  title: string;
  description?: string;
  properties: Property[];
  columns: Column[];
  preview_rows: string[][];
  row_count: number;
  column_count: number;
  file_path?: string;
  file_size_bytes?: number;
}

/**
 * Validate a create/update payload. `requireTitle` is true for POST
 * (title required) and false for PUT (partial update allowed).
 */
export function validateDatasetInput(
  body: unknown,
  requireTitle: boolean,
): { ok: true; value: Partial<DatasetInput> } | { ok: false; error: string } {
  if (!isRecord(body)) return { ok: false, error: "Request body must be a JSON object." };
  const out: Partial<DatasetInput> = {};

  if (body.title !== undefined || requireTitle) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return { ok: false, error: "title is required." };
    }
    if (body.title.length > TITLE_MAX) {
      return { ok: false, error: "title too long (max 200 characters)." };
    }
    out.title = body.title;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      return { ok: false, error: "description must be a string." };
    }
    if (body.description.length > DESCRIPTION_MAX) {
      return { ok: false, error: "description too long (max 5000 characters)." };
    }
    out.description = body.description;
  }

  if (body.properties !== undefined) {
    const r = validateProperties(body.properties);
    if (!r.ok) return r;
    out.properties = r.value;
  }
  if (body.columns !== undefined) {
    const r = validateColumns(body.columns);
    if (!r.ok) return r;
    out.columns = r.value;
  }
  if (body.preview_rows !== undefined) {
    const r = cleanPreviewRows(body.preview_rows);
    if (!r.ok) return r;
    out.preview_rows = r.value;
  }
  if (body.row_count !== undefined) {
    if (typeof body.row_count !== "number" || !Number.isInteger(body.row_count) || body.row_count < 0) {
      return { ok: false, error: "row_count must be a non-negative integer." };
    }
    out.row_count = body.row_count;
  }
  if (body.column_count !== undefined) {
    if (typeof body.column_count !== "number" || !Number.isInteger(body.column_count) || body.column_count < 0) {
      return { ok: false, error: "column_count must be a non-negative integer." };
    }
    out.column_count = body.column_count;
  }
  if (body.file_path !== undefined) {
    if (typeof body.file_path !== "string" || body.file_path.length === 0 || body.file_path.includes("..")) {
      return { ok: false, error: "file_path is invalid." };
    }
    out.file_path = body.file_path;
  }
  if (body.file_size_bytes !== undefined) {
    if (typeof body.file_size_bytes !== "number" || !Number.isInteger(body.file_size_bytes) || body.file_size_bytes < 0) {
      return { ok: false, error: "file_size_bytes must be a non-negative integer." };
    }
    out.file_size_bytes = body.file_size_bytes;
  }
  return { ok: true, value: out };
}

/** Map a Supabase row (snake_case) to the shared Dataset shape. */
export function toDataset(row: Record<string, unknown>): Dataset {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: typeof row.description === "string" ? row.description : undefined,
    properties: Array.isArray(row.properties) ? (row.properties as Property[]) : [],
    columns: Array.isArray(row.columns) ? (row.columns as Column[]) : [],
    preview_rows: Array.isArray(row.preview_rows) ? (row.preview_rows as string[][]) : [],
    row_count: typeof row.row_count === "number" ? row.row_count : 0,
    column_count: typeof row.column_count === "number" ? row.column_count : 0,
    file_url: typeof row.file_url === "string" ? row.file_url : undefined,
    file_path: typeof row.file_path === "string" ? row.file_path : undefined,
    file_size_bytes: typeof row.file_size_bytes === "number" ? row.file_size_bytes : undefined,
    position: typeof row.position === "number" ? row.position : 0,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}
