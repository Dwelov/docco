import Papa from "papaparse";
import type { Column, ColumnStats, ColumnType } from "./types";

const BOOLEAN_VALUES = new Set([
  "true",
  "false",
  "yes",
  "no",
  "y",
  "n",
  "t",
  "f",
]);

const DATE_LIKE =
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$|^\d{1,2}\/\d{1,2}\/\d{2,4}$|^\d{1,2}-\d{1,2}-\d{2,4}$/;

function isNumericValue(value: string): boolean {
  if (value === "") return false;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n);
}

function isDateValue(value: string): boolean {
  if (value === "") return false;
  if (!DATE_LIKE.test(value.trim())) return false;
  return !Number.isNaN(Date.parse(value));
}

/** Detect a column type from its (string) values. Empty cells are ignored. */
export function detectColumnType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  if (nonEmpty.length === 0) return "text";

  const lower = nonEmpty.map((v) => v.trim().toLowerCase());
  if (lower.every((v) => BOOLEAN_VALUES.has(v))) return "boolean";

  const numericCount = nonEmpty.filter(isNumericValue).length;
  if (numericCount / nonEmpty.length >= 0.9) return "numeric";

  const dateCount = nonEmpty.filter(isDateValue).length;
  if (dateCount / nonEmpty.length >= 0.9) return "date";

  const distinct = new Set(nonEmpty.map((v) => v.trim()));
  if (distinct.size <= 20 && distinct.size <= Math.max(10, nonEmpty.length * 0.5)) {
    return "categorical";
  }
  return "text";
}

/** Compute stats for a column. `values` are raw string cells. */
export function computeColumnStats(
  values: string[],
  type: ColumnType,
): ColumnStats | undefined {
  const nonEmpty = values.filter((v) => v.trim() !== "");
  if (nonEmpty.length === 0) return undefined;

  if (type === "numeric") {
    const nums = nonEmpty
      .map((v) => Number(v.replace(/,/g, "")))
      .filter((n) => Number.isFinite(n));
    if (nums.length === 0) return undefined;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const binCount = 10;
    const bins = new Array<number>(binCount).fill(0);
    if (min === max) {
      bins[Math.floor(binCount / 2)] = nums.length;
    } else {
      for (const n of nums) {
        const idx = Math.min(
          binCount - 1,
          Math.floor(((n - min) / (max - min)) * binCount),
        );
        bins[idx] += 1;
      }
    }
    return { min, max, mean, bins };
  }

  if (type === "categorical" || type === "boolean") {
    const counts = new Map<string, number>();
    for (const v of nonEmpty) {
      const key = v.trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const top = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([value, count]) => ({
        value: value.length > 40 ? `${value.slice(0, 40)}…` : value,
        pct: Math.round((count / nonEmpty.length) * 1000) / 10,
      }));
    return { top };
  }

  return undefined;
}

/** Rename blank/duplicate headers: "", "col" -> "col", "col_2", ... */
export function sanitizeColumnNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((raw, i) => {
    let base = raw.trim();
    if (base === "") base = i === 0 ? "col" : `col_${i + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (count === 0) return base;
    return `${base}_${count + 1}`;
  });
}

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  row_count: number;
  column_count: number;
}

/** Parse CSV text with PapaParse (auto delimiter, header row required). */
export function parseCsvText(csvText: string): ParsedCsv {
  const result = Papa.parse<string[]>(csvText, {
    delimiter: "",
    skipEmptyLines: "greedy",
  });
  const allRows = (result.data as string[][]).map((row) =>
    row.map((cell) => (cell ?? "").toString()),
  );
  if (allRows.length === 0) {
    return { headers: [], rows: [], row_count: 0, column_count: 0 };
  }
  const headers = sanitizeColumnNames(allRows[0]);
  const rows = allRows.slice(1);
  return {
    headers,
    rows,
    row_count: rows.length,
    column_count: headers.length,
  };
}

/**
 * Build Column metadata (types + stats) from headers and rows.
 * Stats are computed on at most `statsLimit` rows and 50 columns (PRD §13).
 */
export function analyzeColumns(
  headers: string[],
  rows: string[][],
  statsLimit = 10_000,
): Column[] {
  const sample = rows.slice(0, statsLimit);
  return headers.slice(0, 50).map((name, colIdx) => {
    const values = sample.map((row) => row[colIdx] ?? "");
    const type = detectColumnType(values);
    const stats = computeColumnStats(values, type);
    return stats ? { name, type, stats } : { name, type };
  });
}

export function formatRowCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`;
}
