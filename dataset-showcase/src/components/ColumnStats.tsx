import type { Column } from "@/lib/types";

interface ColumnStatsProps {
  column: Column;
}

export default function ColumnStats({ column }: ColumnStatsProps) {
  const stats = column.stats;
  if (!stats) return null;

  if (column.type === "numeric" && stats.bins && stats.bins.length > 0) {
    const maxBin = Math.max(...stats.bins, 1);
    return (
      <div className="mt-1.5 border-t border-gray-100 pt-1.5" aria-label={`Statistics for ${column.name}`}>
        <div className="flex h-7 items-end gap-[2px]" aria-hidden="true">
          {stats.bins.map((count, i) => (
            <div
              key={i}
              className="min-w-[3px] flex-1 rounded-[1px] bg-[#0E7490]/70"
              style={{ height: `${Math.max(8, Math.round((count / maxBin) * 100))}%` }}
            />
          ))}
        </div>
        <div className="mt-0.5 flex justify-between text-[10px] tabular-nums text-gray-500">
          <span>min {formatStatNumber(stats.min)}</span>
          <span>max {formatStatNumber(stats.max)}</span>
        </div>
      </div>
    );
  }

  if ((column.type === "categorical" || column.type === "boolean") && stats.top) {
    return (
      <div className="mt-1.5 space-y-1 border-t border-gray-100 pt-1.5" aria-label={`Top values for ${column.name}`}>
        {stats.top.map((item) => (
          <div key={item.value} className="flex items-center gap-1.5 text-[10px]">
            <span className="max-w-[90px] truncate text-gray-600" title={item.value}>
              {item.value}
            </span>
            <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#0E7490]/70"
                style={{ width: `${Math.min(100, Math.max(2, item.pct))}%` }}
              />
            </div>
            <span className="tabular-nums text-gray-500">{item.pct}%</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function formatStatNumber(n: number | undefined): string {
  if (n === undefined) return "—";
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
