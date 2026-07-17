"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadContactsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.toLowerCase().endsWith(".csv")) {
        setError("Please drop a .csv file");
        return;
      }
      setFile(dropped);
      setError("");
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a CSV file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/contacts/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data);

      if (data.imported > 0) {
        setTimeout(() => {
          router.push("/dashboard/contacts");
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/contacts"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-80 transition"
          style={{ color: "var(--primary)" }}
        >
          <i className="bi bi-arrow-left" />
          Back to contacts
        </Link>
      </div>

      <div className="rounded-2xl border p-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h1 className="font-display text-2xl mb-2" style={{ color: "var(--text)" }}>
          Upload contacts from CSV
        </h1>
        <p className="mb-6" style={{ color: "var(--text-muted)" }}>
          Import multiple contacts at once using a CSV file
        </p>

        {/* CSV format guide */}
        <div
          className="rounded-xl p-5 mb-6 border"
          style={{ background: "rgba(96,165,250,0.06)", borderColor: "rgba(96,165,250,0.25)" }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--email)" }}>
              <i className="bi bi-info-circle-fill" style={{ fontSize: 14 }} />
              CSV format
            </h3>
            <a
              href="/sample-contacts.csv"
              download
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition hover:border-white/20 shrink-0"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              <i className="bi bi-download" style={{ fontSize: 11 }} />
              Download sample CSV
            </a>
          </div>
          <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
            Your CSV file should have these columns (header row required):
          </p>
          <code
            className="text-sm px-3 py-1.5 rounded-lg block mb-3 font-mono"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            phone,email,whatsappId,tags
          </code>
          <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
            Example:
          </p>
          <code
            className="text-xs px-3 py-2.5 rounded-lg block font-mono leading-relaxed"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            phone,email,whatsappId,tags<br />
            0712345678,john@example.com,,customer;vip<br />
            0723456789,jane@example.com,254723456789,customer
          </code>
          <ul className="text-xs mt-3 space-y-1" style={{ color: "var(--text-faint)" }}>
            <li>• Phone numbers: Kenyan format (0712345678 or +254712345678)</li>
            <li>• Tags: separate multiple tags with semicolons</li>
            <li>• Email and whatsappId are optional</li>
          </ul>
        </div>

        {error && (
          <div
            className="text-sm p-4 rounded-lg mb-5 border"
            style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {result && (
          <div
            className="rounded-xl p-5 mb-6 border"
            style={{ background: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.25)" }}
          >
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: "var(--whatsapp)" }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: 14 }} />
              Upload complete
            </h3>
            <p className="text-sm" style={{ color: "var(--text)" }}>
              {result.imported} contacts imported successfully
            </p>
            {result.skipped > 0 && (
              <p className="text-sm mt-1 flex items-center gap-1.5" style={{ color: "var(--sms)" }}>
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 12 }} />
                {result.skipped} contacts skipped (duplicates or invalid)
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1" style={{ color: "#fca5a5" }}>
                  Errors:
                </p>
                <ul className="text-xs list-disc list-inside space-y-0.5" style={{ color: "#fca5a5" }}>
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {result.errors.length > 5 && <li>… and {result.errors.length - 5} more</li>}
                </ul>
              </div>
            )}
            <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
              Redirecting to contacts page…
            </p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
              Select CSV file
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition"
              style={{
                borderColor: dragActive ? "var(--primary)" : "var(--border-strong)",
                background: dragActive ? "rgba(139,92,246,0.06)" : "var(--surface-2)",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)" }}
                  >
                    <i className="bi bi-filetype-csv" style={{ color: "var(--primary)", fontSize: 18 }} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {file.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-up" style={{ fontSize: 32, color: "var(--text-faint)" }} />
                  <p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>
                    <span style={{ color: "var(--primary)" }}>Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                    CSV files only
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white" }}
            >
              {uploading ? "Uploading…" : "Upload contacts"}
            </button>
            <Link
              href="/dashboard/contacts"
              className="px-6 py-3 rounded-lg font-medium text-sm border transition hover:border-white/20 text-center"
              style={{ borderColor: "var(--border-strong)", color: "var(--text)" }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}