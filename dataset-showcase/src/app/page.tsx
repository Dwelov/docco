"use client";

import { useCallback, useEffect, useState } from "react";
import Slider from "@/components/Slider";
import { fixtureDatasets } from "@/lib/fixture";
import type { Dataset } from "@/lib/types";

export default function Home() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setStatus("loading");
    setError(null);
    window.setTimeout(() => {
      setDatasets(fixtureDatasets);
      setStatus("ready");
    }, 400);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setDatasets(fixtureDatasets);
      setStatus("ready");
    }, 400);
    return () => window.clearTimeout(id);
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
