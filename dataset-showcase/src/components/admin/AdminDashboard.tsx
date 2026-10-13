"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Dataset } from "@/lib/types";
import DatasetForm from "./DatasetForm";
import DatasetList from "./DatasetList";

type View = { name: "list" } | { name: "new" } | { name: "edit"; dataset: Dataset };

export default function AdminDashboard() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ name: "list" });

  const refresh = useCallback(async () => {
    const res = await fetch("/api/datasets", { cache: "no-store" });
    if (!res.ok) {
      setError("Could not load datasets.");
    } else {
      const data: unknown = await res.json();
      setDatasets(Array.isArray(data) ? (data as Dataset[]) : []);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch {
        if (!cancelled) {
          setError("Could not load datasets.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  function handleSaved(saved: Dataset) {
    setDatasets((prev) => {
      const exists = prev.some((d) => d.id === saved.id);
      if (exists) return prev.map((d) => (d.id === saved.id ? saved : d));
      return [...prev, saved].sort((a, b) => a.position - b.position);
    });
    setView({ name: "list" });
  }

  async function handleDelete(dataset: Dataset) {
    const res = await fetch(`/api/admin/datasets/${dataset.id}`, { method: "DELETE" });
    if (res.ok) {
      setDatasets((prev) => prev.filter((d) => d.id !== dataset.id));
      if (view.name === "edit" && view.dataset.id === dataset.id) {
        setView({ name: "list" });
      }
    } else {
      setError("Delete failed. Try again.");
    }
  }

  async function handleMove(id: string, direction: -1 | 1) {
    const ordered = [...datasets].sort((a, b) => a.position - b.position);
    const i = ordered.findIndex((d) => d.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
    const ids = ordered.map((d) => d.id);
    const res = await fetch("/api/admin/datasets/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      setDatasets(ordered.map((d, position) => ({ ...d, position })));
    } else {
      setError("Reorder failed. Try again.");
    }
  }

  const selectedId = view.name === "edit" ? view.dataset.id : null;

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">Admin</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-[#0E7490] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
          >
            View site
          </Link>
        </div>
      </div>
      {loading ? (
        <div aria-busy="true" aria-label="Loading admin" className="space-y-2">
          <div className="h-6 w-1/4 animate-pulse rounded bg-gray-200" />
          <div className="h-24 animate-pulse rounded bg-gray-100" />
          <div className="h-24 animate-pulse rounded bg-gray-100" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <section aria-label="Dataset list">
            <DatasetList
              datasets={[...datasets].sort((a, b) => a.position - b.position)}
              selectedId={selectedId}
              onNew={() => setView({ name: "new" })}
              onEdit={(dataset) => setView({ name: "edit", dataset })}
              onDelete={handleDelete}
              onMove={handleMove}
            />
          </section>
          <section aria-label="Dataset form" className="rounded-lg border border-gray-200 bg-white p-4">
            {error ? (
              <p role="alert" className="mb-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            {view.name === "list" ? (
              <p className="text-sm text-gray-500">
                Select a dataset to edit, or start a new one.
              </p>
            ) : view.name === "new" ? (
              <DatasetForm
                key="new"
                initial={null}
                onSaved={handleSaved}
                onCancel={() => setView({ name: "list" })}
              />
            ) : (
              <DatasetForm
                key={view.dataset.id}
                initial={view.dataset}
                onSaved={handleSaved}
                onCancel={() => setView({ name: "list" })}
              />
            )}
          </section>
        </div>
      )}
    </main>
  );
}
