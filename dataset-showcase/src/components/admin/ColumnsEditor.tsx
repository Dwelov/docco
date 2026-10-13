"use client";

import type { Column } from "@/lib/types";

interface ColumnsEditorProps {
  value: Column[];
  onChange: (next: Column[]) => void;
}

export default function ColumnsEditor({ value, onChange }: ColumnsEditorProps) {
  function updateDescription(index: number, description: string) {
    onChange(value.map((col, i) => (i === index ? { ...col, description } : col)));
  }

  if (value.length === 0) {
    return <p className="text-sm text-gray-500">Upload a CSV to detect columns.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th scope="col" className="px-3 py-2 text-left font-semibold text-black">
              Column
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold text-black">
              Type
            </th>
            <th scope="col" className="px-3 py-2 text-left font-semibold text-black">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {value.map((col, i) => (
            <tr key={`${col.name}-${i}`} className="border-t border-gray-100">
              <td className="px-3 py-1.5 font-mono text-[13px] text-gray-800">{col.name}</td>
              <td className="px-3 py-1.5 text-xs uppercase tracking-wide text-gray-500">{col.type}</td>
              <td className="px-3 py-1.5">
                <label htmlFor={`col-desc-${i}`} className="sr-only">
                  Description for {col.name}
                </label>
                <input
                  id={`col-desc-${i}`}
                  type="text"
                  placeholder="Optional description"
                  value={col.description ?? ""}
                  onChange={(e) => updateDescription(i, e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
