"use client";

import { useState } from "react";

interface RetryButtonProps {
  campaignId: string;
}

export default function RetryButton({ campaignId }: RetryButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRetry = async () => {
    if (!confirm("Retry all failed messages in this campaign?")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/retry`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to retry messages");
      }

      setMessage(data.message);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-right">
      <button
        onClick={handleRetry}
        disabled={loading}
        className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition disabled:opacity-50"
      >
        {loading ? "Retrying..." : "🔄 Retry Failed Messages"}
      </button>
      {message && (
        <p className="text-sm text-gray-600 mt-2">{message}</p>
      )}
    </div>
  );
}
