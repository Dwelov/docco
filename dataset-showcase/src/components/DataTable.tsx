"use client";

import { useMemo, useState } from "react";
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { formatRowCount } from "@/lib/csv";
import type { Column } from "@/lib/types";
import ColumnStats from "./ColumnStats";

const PAGE_SIZES = [50, 100, 250, 500];
const DEFAULT_PAGE_SIZE = 100;

const TYPE_BADGE: Record<string, string> = {
  numeric: "num",
  categorical: "cat",
  boolean: "bool",
  date: "date",
  text: "text",
};

interface DataTableProps {
  headers: string[];
  rows: string[][];
  /** Optional column metadata (type, description, stats) matched by header name. */
  columns?: Column[];
  pageSize?: number;
  maxHeightClass?: string;
  showRowNumbers?: boolean;
}

/**
 * Client-side paginated table: renders a page at a time so even very large
 * CSVs can be browsed without mounting every row, and every column is
 * scrollable horizontally. Row numbers are global positions in `rows`.
 */
export default function DataTable({
  headers,
  rows,
  columns,
  pageSize = DEFAULT_PAGE_SIZE,
  maxHeightClass = "max-h-[420px]",
  showRowNumbers = true,
}: DataTableProps) {
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSizeState));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * pageSizeState;
  const end = Math.min(start + pageSizeState, rows.length);

  const columnMeta = useMemo(() => {
    if (!columns || columns.length === 0) return null;
    return new Map(columns.map((column) => [column.name, column]));
  }, [columns]);

  const visibleRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  function goTo(next: number) {
    setPage(Math.min(Math.max(next, 0), pageCount - 1));
  }

  return (
    <div>
      <div className={`overflow-auto ${maxHeightClass}`}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e5e7eb]">
            <tr>
              {showRowNumbers ? (
                <th
                  scope="col"
                  className="sticky left-0 z-20 w-px border-b border-gray-200 bg-white px-3 py-2.5 text-right align-top text-[11px] font-medium text-gray-400"
                >
                  #
                </th>
              ) : null}
              {headers.map((header, c) => {
                const meta = columnMeta?.get(header);
                return (
                  <th
                    key={c}
                    scope="col"
                    className="min-w-[150px] max-w-[260px] border-b border-gray-200 px-3 py-2.5 text-left align-top"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-black" title={header}>
                        {header}
                      </span>
                      {meta ? (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-gray-500">
                          {TYPE_BADGE[meta.type] ?? meta.type}
                        </span>
                      ) : null}
                    </div>
                    {meta?.description ? (
                      <p className="mt-0.5 truncate text-[11px] font-normal text-gray-500" title={meta.description}>
                        {meta.description}
                      </p>
                    ) : null}
                    {meta ? <ColumnStats column={meta} /> : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, r) => (
              <tr key={start + r} className="group hover:bg-gray-50">
                {showRowNumbers ? (
                  <td className="sticky left-0 w-px border-t border-gray-100 bg-white px-3 py-1.5 text-right font-mono text-[11px] tabular-nums text-gray-400 group-hover:bg-gray-50">
                    {formatRowCount(start + r + 1)}
                  </td>
                ) : null}
                {headers.map((header, c) => {
                  const cell = row[c] ?? "";
                  return (
                    <td
                      key={c}
                      className="max-w-[260px] truncate border-t border-gray-100 px-3 py-1.5 font-mono text-[13px] text-gray-800"
                      title={cell}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + (showRowNumbers ? 1 : 0)}
                  className="px-3 py-6 text-center text-sm text-gray-500"
                >
                  No rows to display.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
        <span className="tabular-nums">
          {rows.length === 0
            ? "0 rows"
            : `Rows ${formatRowCount(start + 1)}–${formatRowCount(end)} of ${formatRowCount(rows.length)}`}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span>Rows per page</span>
            <select
              value={pageSizeState}
              onChange={(e) => {
                setPageSizeState(Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs tabular-nums text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            <PagerButton label="First page" disabled={safePage === 0} onClick={() => goTo(0)}>
              <ChevronFirst className="h-3.5 w-3.5" aria-hidden="true" />
            </PagerButton>
            <PagerButton label="Previous page" disabled={safePage === 0} onClick={() => goTo(safePage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </PagerButton>
            <span className="px-1 tabular-nums" aria-live="polite">
              Page {safePage + 1} / {pageCount}
            </span>
            <PagerButton label="Next page" disabled={safePage >= pageCount - 1} onClick={() => goTo(safePage + 1)}>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </PagerButton>
            <PagerButton label="Last page" disabled={safePage >= pageCount - 1} onClick={() => goTo(pageCount - 1)}>
              <ChevronLast className="h-3.5 w-3.5" aria-hidden="true" />
            </PagerButton>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PagerButtonProps {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function PagerButton({ label, disabled, onClick, children }: PagerButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-700 enabled:hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
