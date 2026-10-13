"use client";

import type { Property } from "@/lib/types";

interface PropertiesEditorProps {
  value: Property[];
  onChange: (next: Property[]) => void;
}

export default function PropertiesEditor({ value, onChange }: PropertiesEditorProps) {
  function updateRow(index: number, field: "key" | "value", text: string) {
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: text } : row)));
  }

  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...value, { key: "", value: "" }]);
  }

  return (
    <div>
      <div className="space-y-2">
        {value.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <label htmlFor={`prop-key-${i}`} className="sr-only">
              Property {i + 1} key
            </label>
            <input
              id={`prop-key-${i}`}
              type="text"
              placeholder="Key"
              value={row.key}
              onChange={(e) => updateRow(i, "key", e.target.value)}
              className="w-1/3 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
            />
            <label htmlFor={`prop-value-${i}`} className="sr-only">
              Property {i + 1} value
            </label>
            <input
              id={`prop-value-${i}`}
              type="text"
              placeholder="Value"
              value={row.value}
              onChange={(e) => updateRow(i, "value", e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
            />
            <button
              type="button"
              aria-label={`Remove property ${i + 1}`}
              onClick={() => removeRow(i)}
              className="rounded-full px-2 py-1 text-lg leading-none text-gray-500 hover:bg-gray-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
      >
        Add property
      </button>
    </div>
  );
}
