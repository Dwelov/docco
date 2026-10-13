import type { Dataset } from "@/lib/types";
import { formatRowCount } from "@/lib/csv";
import ColumnStats from "./ColumnStats";

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
  const shown = dataset.preview_rows.length;
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
            {dataset.preview_rows.map((row, r) => (
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
      <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
        Showing first {formatRowCount(shown)} of {formatRowCount(dataset.row_count)} rows
      </div>
    </section>
  );
}
