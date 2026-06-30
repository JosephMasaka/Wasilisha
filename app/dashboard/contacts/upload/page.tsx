"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadContactsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
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
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back to Contacts
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Contacts from CSV
        </h1>
        <p className="text-gray-600 mb-6">
          Import multiple contacts at once using a CSV file
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">CSV Format</h3>
          <p className="text-sm text-blue-800 mb-2">
            Your CSV file should have these columns (header row required):
          </p>
          <code className="text-sm bg-blue-100 px-2 py-1 rounded block mb-2">
            phone,email,whatsappId,tags
          </code>
          <p className="text-sm text-blue-800">
            Example:
          </p>
          <code className="text-xs bg-blue-100 px-2 py-1 rounded block font-mono">
            phone,email,whatsappId,tags<br />
            0712345678,john@example.com,,customer;vip<br />
            0723456789,jane@example.com,254723456789,customer
          </code>
          <p className="text-xs text-blue-700 mt-2">
            • Phone numbers: Kenyan format (0712345678 or +254712345678)<br />
            • Tags: Separate multiple tags with semicolons<br />
            • Email and whatsappId are optional
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-green-900 mb-2">
              Upload Complete!
            </h3>
            <p className="text-sm text-green-800">
              ✓ {result.imported} contacts imported successfully
            </p>
            {result.skipped > 0 && (
              <p className="text-sm text-orange-600">
                ⚠ {result.skipped} contacts skipped (duplicates or invalid)
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-red-600 font-medium">Errors:</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li>... and {result.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            <p className="text-sm text-green-700 mt-2">
              Redirecting to contacts page...
            </p>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Contacts"}
            </button>
            <Link
              href="/dashboard/contacts"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
