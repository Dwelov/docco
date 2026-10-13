"use client";

import { useRef, useState } from "react";
import { formatFileSize, parseCsvText } from "@/lib/csv";

export interface ParsedCsvFile {
  file: File;
  headers: string[];
  rows: string[][];
  rowCount: number;
  columnCount: number;
}

interface CsvDropzoneProps {
  onParsed: (parsed: ParsedCsvFile) => void;
  onError: (message: string) => void;
}

const MAX_BYTES = 50 * 1024 * 1024;

export default function CsvDropzone({ onParsed, onError }: CsvDropzoneProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      onError("Only .csv files are accepted.");
      return;
    }
    if (file.size > MAX_BYTES) {
      onError("File is too large. Maximum size is 50 MB.");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      onError("Could not read the file. Try again.");
      return;
    }
    const parsed = parseCsvText(text);
    if (parsed.headers.length === 0 || parsed.row_count === 0) {
      onError("CSV has no data rows. Add a header row and at least one data row.");
      return;
    }
    setFileName(file.name);
    setFileSize(file.size);
    onParsed({
      file,
      headers: parsed.headers,
      rows: parsed.rows,
      rowCount: parsed.row_count,
      columnCount: parsed.column_count,
    });
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a CSV file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] ${
          dragging ? "border-[#0E7490] bg-[#0E7490]/5" : "border-gray-300 bg-gray-50 hover:border-gray-400"
        }`}
      >
        <p className="text-sm font-medium text-black">
          Drag &amp; drop a .csv file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">CSV only, max 50 MB</p>
        {fileName ? (
          <p className="mt-2 text-sm text-gray-700">
            {fileName}
            {fileSize !== null ? ` · ${formatFileSize(fileSize)}` : ""}
          </p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        aria-hidden="true"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
