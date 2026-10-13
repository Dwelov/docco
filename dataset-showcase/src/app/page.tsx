"use client";

import { useCallback, useEffect, useState } from "react";
import Slider from "@/components/Slider";
import type { Dataset } from "@/lib/types";

async function fetchDatasets(signal: AbortSignal): Promise<Dataset[]> {
  const res = await fetch("/api/datasets", { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error("The server could not load datasets.");
  }
  const data: unknown = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from the server.");
  }
  return data as Dataset[];
}

export default function Home() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    setError(null);
    const controller = new AbortController();
    fetchDatasets(controller.signal).then(
      (rows) => {
        setDatasets(rows);
        setStatus("ready");
      },
      (err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load datasets.");
        setStatus("error");
      },
    );
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchDatasets(controller.signal).then(
      (rows) => {
        setDatasets(rows);
        setStatus("ready");
      },
      (err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load datasets.");
        setStatus("error");
      },
    );
    return () => controller.abort();
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 md:py-12">
      <Slider
        datasets={datasets}
        isLoading={status === "loading"}
        error={status === "error" ? (error ?? "Failed to load.") : null}
        onRetry={load}
      />
    </main>
  );
}
