"use client";

import { useEffect, useState } from "react";
import { formatFileSize, formatRowCount, parseCsvText } from "@/lib/csv";
import type { Column } from "@/lib/types";
import DataTable from "./DataTable";

interface CsvFullViewProps {
  /** Public URL of the CSV file to load. */
  url: string;
  fileSizeBytes?: number;
  /** Row count from the dataset metadata, used for the parsing message. */
  expectedRows?: number;
  columns?: Column[];
  maxHeightClass?: string;
}

type Status = "loading" | "parsing" | "ready" | "error";

/**
 * Downloads the whole stored CSV and shows every row + column through
 * DataTable. The download reports byte progress and can be aborted, and a
 * failed load offers a retry and a plain download link.
 */
export default function CsvFullView({
  url,
  fileSizeBytes,
  expectedRows,
  columns,
  maxHeightClass,
}: CsvFullViewProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [received, setReceived] = useState(0);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setHeaders([]);
      setRows([]);
      setReceived(0);
      setPercent(null);
      setError(null);

      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Could not download the CSV file (HTTP ${res.status}).`);
        }
        const total =
          fileSizeBytes ?? (Number(res.headers.get("Content-Length")) || undefined);

        const parts: string[] = [];
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let loaded = 0;
          let lastProgress = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            loaded += value.byteLength;
            parts.push(decoder.decode(value, { stream: true }));
            const now = Date.now();
            if (now - lastProgress >= 120) {
              lastProgress = now;
              setReceived(loaded);
              if (total) setPercent(Math.min(99, Math.round((loaded / total) * 100)));
            }
          }
          parts.push(decoder.decode());
        } else {
          parts.push(await res.text());
        }

        if (cancelled) return;
        // Let the "Parsing…" message paint before the synchronous parse.
        setStatus("parsing");
        await new Promise((resolve) => setTimeout(resolve, 0));
        if (cancelled) return;

        const parsed = parseCsvText(parts.join(""));
        if (parsed.headers.length === 0 || parsed.row_count === 0) {
          throw new Error("The CSV file has no data rows.");
        }
        setHeaders(parsed.headers);
        setRows(parsed.rows);
        setStatus("ready");
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setError(err instanceof Error ? err.message : "Could not load the file.");
        setStatus("error");
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, fileSizeBytes, attempt]);

  if (status === "loading" || status === "parsing") {
    const parsing = status === "parsing";
    return (
      <div aria-busy="true" aria-live="polite" className="px-4 py-10 text-center">
        <p className="text-sm font-medium text-black">
          {parsing ? "Parsing all rows…" : "Loading all rows…"}
        </p>
        <p className="mt-1 text-xs tabular-nums text-gray-500">
          {parsing
            ? typeof expectedRows === "number"
              ? `${formatRowCount(expectedRows)} rows`
              : "This can take a moment for large files"
            : `Fetching the CSV file${received > 0 ? ` · ${formatFileSize(received)}` : ""}${percent !== null ? ` · ${percent}%` : ""}`}
        </p>
        <div className="mx-auto mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-gray-100">
          {percent === null || parsing ? (
            <div className="h-full w-1/3 animate-pulse rounded-full bg-[#0E7490]" />
          ) : (
            <div
              className="h-full rounded-full bg-[#0E7490] transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          )}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="px-4 py-10 text-center">
        <p role="alert" className="text-sm text-red-700">
          {error ?? "Could not load the file."}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="rounded-full bg-[#0E7490] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#0c637b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <a
            href={url}
            className="text-sm font-medium text-[#0E7490] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
          >
            Download CSV
          </a>
        </div>
      </div>
    );
  }

  return <DataTable headers={headers} rows={rows} columns={columns} maxHeightClass={maxHeightClass} />;
}
