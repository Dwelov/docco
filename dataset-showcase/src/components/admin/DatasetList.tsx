"use client";

import { useEffect, useRef, useState } from "react";
import type { Dataset } from "@/lib/types";
import { formatRowCount } from "@/lib/csv";

interface DatasetListProps {
  datasets: Dataset[];
  selectedId: string | null;
  onNew: () => void;
  onEdit: (dataset: Dataset) => void;
  onDelete: (dataset: Dataset) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

export default function DatasetList({ datasets, selectedId, onNew, onEdit, onDelete, onMove }: DatasetListProps) {
  const [confirming, setConfirming] = useState<Dataset | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) {
      cancelRef.current?.focus();
      function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setConfirming(null);
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [confirming]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-black">Datasets ({datasets.length})</h2>
        <button
          type="button"
          onClick={onNew}
          className="rounded-full bg-[#0E7490] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#0c637b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] focus-visible:ring-offset-2"
        >
          New dataset
        </button>
      </div>
      {datasets.length === 0 ? (
        <p className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
          No datasets yet. Create one to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {datasets.map((ds, i) => (
            <li
              key={ds.id}
              className={`rounded-lg border p-3 ${
                ds.id === selectedId ? "border-[#0E7490] bg-[#0E7490]/5" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-black" title={ds.title}>
                    {ds.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRowCount(ds.row_count)} rows · {formatRowCount(ds.column_count)} cols
                    {!ds.file_path ? " · no file" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${ds.title} up`}
                    disabled={i === 0}
                    onClick={() => onMove(ds.id, -1)}
                    className="rounded px-1.5 py-1 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${ds.title} down`}
                    disabled={i === datasets.length - 1}
                    onClick={() => onMove(ds.id, 1)}
                    className="rounded px-1.5 py-1 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(ds)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-black hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(ds)}
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="alertdialog" aria-modal="true" aria-label="Confirm delete" className="w-full max-w-sm rounded-lg bg-white p-5">
            <p className="font-semibold text-black">Delete “{confirming.title}”?</p>
            <p className="mt-1 text-sm text-gray-600">
              This removes the dataset and its CSV file. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setConfirming(null)}
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(confirming);
                  setConfirming(null);
                }}
                className="rounded-full bg-red-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
