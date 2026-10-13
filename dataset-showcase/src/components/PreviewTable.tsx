"use client";

import { useState } from "react";
import type { Dataset } from "@/lib/types";
import { formatRowCount } from "@/lib/csv";
import ColumnStats from "./ColumnStats";
import CsvFullView from "./CsvFullView";

interface PreviewTableProps {
  dataset: Dataset;
}

const TYPE_BADGE: Record<string, string> = {
  numeric: "num",
  categorical: "cat",
  boolean: "bool",
  date: "date",
  text: "text",
};

export default function PreviewTable({ dataset }: PreviewTableProps) {
  const [showAll, setShowAll] = useState(false);
  const fileUrl = dataset.file_url;
  const sampleRows = dataset.preview_rows;
  const isFull = showAll && fileUrl !== undefined;

  return (
    <section
      aria-label={`Preview of ${dataset.title}`}
      className="overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      {dataset.description ? (
        <div className="border-b border-gray-200 bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800">
          {dataset.description}
        </div>
      ) : null}
      {isFull ? (
        <CsvFullView
          url={fileUrl}
          fileSizeBytes={dataset.file_size_bytes}
          expectedRows={dataset.row_count}
          columns={dataset.columns}
        />
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_#e5e7eb]">
              <tr>
                {dataset.columns.map((col) => (
                  <th
                    key={col.name}
                    scope="col"
                    className="min-w-[150px] max-w-[260px] border-b border-gray-200 px-3 py-2.5 text-left align-top"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-black" title={col.name}>
                        {col.name}
                      </span>
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        {TYPE_BADGE[col.type] ?? col.type}
                      </span>
                    </div>
                    {col.description ? (
                      <p className="mt-0.5 truncate text-[11px] font-normal text-gray-500" title={col.description}>
                        {col.description}
                      </p>
                    ) : null}
                    <ColumnStats column={col} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row, r) => (
                <tr key={r} className="hover:bg-gray-50">
                  {dataset.columns.map((col, c) => {
                    const cell = row[c] ?? "";
                    return (
                      <td
                        key={`${r}-${col.name}`}
                        className="max-w-[260px] truncate border-t border-gray-100 px-3 py-1.5 font-mono text-[13px] text-gray-800"
                        title={cell}
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
        <span className="tabular-nums">
          {isFull
            ? `All ${formatRowCount(dataset.row_count)} rows`
            : `Showing first ${formatRowCount(sampleRows.length)} of ${formatRowCount(dataset.row_count)} rows`}
        </span>
        {fileUrl !== undefined ? (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="font-medium text-[#0E7490] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
          >
            {isFull ? "Show first rows only" : `Preview all ${formatRowCount(dataset.row_count)} rows`}
          </button>
        ) : null}
      </div>
    </section>
  );
}
