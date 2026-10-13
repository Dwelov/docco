"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabaseBrowser";
import { analyzeColumns, formatFileSize, formatRowCount } from "@/lib/csv";
import type { Column, Dataset, Property } from "@/lib/types";
import CsvFullView from "@/components/CsvFullView";
import DataTable from "@/components/DataTable";
import ColumnsEditor from "./ColumnsEditor";
import CsvDropzone, { type ParsedCsvFile } from "./CsvDropzone";
import PropertiesEditor from "./PropertiesEditor";

interface DatasetFormProps {
  initial: Dataset | null;
  onSaved: (dataset: Dataset) => void;
  onCancel: () => void;
}

const AUTO_KEYS = ["Rows", "Columns", "File size"];

function autoProperties(rowCount: number, columnCount: number, fileSize: number): Property[] {
  return [
    { key: "Rows", value: formatRowCount(rowCount) },
    { key: "Columns", value: formatRowCount(columnCount) },
    { key: "File size", value: formatFileSize(fileSize) },
  ];
}

function mergeAutoProperties(current: Property[], auto: Property[]): Property[] {
  const rest = current.filter((p) => !AUTO_KEYS.includes(p.key));
  return [...auto, ...rest];
}

function titleFromFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  return base.replace(/\.csv$/i, "").replace(/[_-]+/g, " ").trim();
}

export default function DatasetForm({ initial, onSaved, onCancel }: DatasetFormProps) {
  const isEdit = initial !== null;
  const [parsed, setParsed] = useState<ParsedCsvFile | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [properties, setProperties] = useState<Property[]>(initial?.properties ?? []);
  const [columns, setColumns] = useState<Column[]>(initial?.columns ?? []);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showStoredFull, setShowStoredFull] = useState(false);

  function handleParsed(p: ParsedCsvFile) {
    setParsed(p);
    setFormError(null);
    setColumns(analyzeColumns(p.headers, p.rows));
    setProperties((prev) => mergeAutoProperties(prev, autoProperties(p.rowCount, p.columnCount, p.file.size)));
    setTitle((prev) => (prev === "" && !isEdit ? titleFromFilename(p.file.name) : prev));
  }

  async function uploadFile(file: File): Promise<{ path: string }> {
    const urlRes = await fetch("/api/admin/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name }),
    });
    if (!urlRes.ok) {
      const data: unknown = await urlRes.json().catch(() => null);
      const message =
        typeof data === "object" && data !== null && "error" in data
          ? String((data as Record<string, unknown>).error)
          : "Could not start the upload.";
      throw new Error(message);
    }
    const { path, token }: { path: string; token: string } = await urlRes.json();
    const supabase = getBrowserClient();
    const { error } = await supabase.storage.from("datasets").uploadToSignedUrl(path, token, file);
    if (error) {
      throw new Error("Upload failed. Check your connection and try again.");
    }
    return { path };
  }

  async function cleanupOrphan(path: string) {
    try {
      await fetch("/api/admin/storage-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
    } catch {
      // Best effort only.
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (title.trim() === "") {
      setFormError("Title is required.");
      return;
    }
    if (!isEdit && !parsed) {
      setFormError("Choose a CSV file first.");
      return;
    }
    setSaving(true);
    setFormError(null);
    setToast(null);

    let uploadedPath: string | null = null;
    try {
      if (parsed) {
        uploadedPath = (await uploadFile(parsed.file)).path;
      }
      const rows = parsed?.rows;
      const body: Record<string, unknown> = {
        title: title.trim(),
        description,
        properties,
        columns,
        row_count: parsed ? parsed.rowCount : (initial?.row_count ?? 0),
        column_count: parsed ? parsed.columnCount : (initial?.column_count ?? 0),
      };
      if (rows) {
        body.preview_rows = rows.slice(0, 20);
      } else if (!isEdit) {
        body.preview_rows = [];
      }
      if (uploadedPath) {
        body.file_path = uploadedPath;
        body.file_size_bytes = parsed?.file.size ?? 0;
      }

      const url = isEdit ? `/api/admin/datasets/${initial.id}` : "/api/admin/datasets";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        const message =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as Record<string, unknown>).error)
            : "Save failed.";
        if (uploadedPath) await cleanupOrphan(uploadedPath);
        throw new Error(message);
      }
      const saved = (await res.json()) as Dataset;
      setToast({ kind: "success", message: "Dataset saved." });
      onSaved(saved);
    } catch (err) {
      setToast({
        kind: "error",
        message: err instanceof Error ? err.message : "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  const previewHeaders = parsed ? parsed.headers : (initial?.columns.map((c) => c.name) ?? []);
  const previewRows: string[][] = parsed ? parsed.rows : (initial?.preview_rows ?? []);
  const showNoFileWarning = isEdit && !initial.file_path && !parsed;

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="text-base font-bold text-black">{isEdit ? `Edit: ${initial.title}` : "New dataset"}</h2>

      {showNoFileWarning ? (
        <p role="note" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This dataset has no CSV file attached. Upload one below to attach it.
        </p>
      ) : null}

      <div>
        <span className="mb-1 block text-sm font-medium text-black">
          CSV file {isEdit ? "(optional — re-upload to replace)" : ""}
        </span>
        <CsvDropzone onParsed={handleParsed} onError={setFormError} />
      </div>

      <div>
        <label htmlFor="ds-title" className="mb-1 block text-sm font-medium text-black">
          Title
        </label>
        <input
          id="ds-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
        />
      </div>

      <div>
        <label htmlFor="ds-description" className="mb-1 block text-sm font-medium text-black">
          Description
        </label>
        <textarea
          id="ds-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
        />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-black">Properties</span>
        <PropertiesEditor value={properties} onChange={setProperties} />
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-black">Columns</span>
        <ColumnsEditor value={columns} onChange={setColumns} />
      </div>

      {previewHeaders.length > 0 ? (
        <div>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-medium text-black">
              {parsed ? "Preview — all rows" : "Preview — saved sample"}
            </span>
            {parsed ? (
              <span className="text-xs tabular-nums text-gray-500">
                {formatRowCount(parsed.rowCount)} rows × {formatRowCount(parsed.columnCount)} columns
              </span>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {parsed ? (
              <DataTable
                key={`${parsed.file.name}:${parsed.file.size}:${parsed.file.lastModified}`}
                headers={parsed.headers}
                rows={parsed.rows}
                maxHeightClass="max-h-80"
              />
            ) : showStoredFull && initial?.file_url ? (
              <CsvFullView
                url={initial.file_url}
                fileSizeBytes={initial.file_size_bytes}
                expectedRows={initial.row_count}
                columns={initial.columns}
                maxHeightClass="max-h-80"
              />
            ) : (
              <DataTable headers={previewHeaders} rows={previewRows} maxHeightClass="max-h-80" />
            )}
          </div>
          {!parsed && initial?.file_url ? (
            <button
              type="button"
              onClick={() => setShowStoredFull((v) => !v)}
              className="mt-1.5 text-xs font-medium text-[#0E7490] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
            >
              {showStoredFull
                ? "Show saved sample only"
                : `Preview all ${formatRowCount(initial.row_count)} rows`}
            </button>
          ) : null}
        </div>
      ) : null}

      {formError ? (
        <p role="alert" className="text-sm text-red-700">
          {formError}
        </p>
      ) : null}
      {toast ? (
        <p role={toast.kind === "error" ? "alert" : "status"} className={`text-sm ${toast.kind === "error" ? "text-red-700" : "text-green-700"}`}>
          {toast.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#0E7490] px-5 py-2 text-sm font-medium text-white hover:bg-[#0c637b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save dataset"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-black hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
