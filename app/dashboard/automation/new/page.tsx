"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewFallbackRulePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    primaryChannel: "whatsapp",
    fallbackChannel: "sms",
    triggerCondition: "undelivered",
    delayMinutes: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (formData.primaryChannel === formData.fallbackChannel) {
        throw new Error("Primary and fallback channels must be different");
      }

      const res = await fetch("/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create rule");
      }

      router.push("/dashboard/automation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/automation"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          ← Back to Automation
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create Fallback Rule
        </h1>
        <p className="text-gray-600 mb-6">
          Set up automatic fallback to another channel when delivery fails
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="WhatsApp to SMS Fallback"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Channel *
              </label>
              <select
                value={formData.primaryChannel}
                onChange={(e) =>
                  setFormData({ ...formData, primaryChannel: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="sms">📱 SMS</option>
                <option value="email">✉️ Email</option>
                <option value="whatsapp">💬 WhatsApp</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Try this channel first
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fallback Channel *
              </label>
              <select
                value={formData.fallbackChannel}
                onChange={(e) =>
                  setFormData({ ...formData, fallbackChannel: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="sms">📱 SMS</option>
                <option value="email">✉️ Email</option>
                <option value="whatsapp">💬 WhatsApp</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Use this if primary fails
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger Condition *
            </label>
            <select
              value={formData.triggerCondition}
              onChange={(e) =>
                setFormData({ ...formData, triggerCondition: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="undelivered">Not Delivered</option>
              <option value="unread">Not Read/Opened (coming soon)</option>
              <option value="bounced">Bounced/Failed</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              What triggers the fallback
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delay (Minutes) *
            </label>
            <input
              type="number"
              required
              min="1"
              max="1440"
              value={formData.delayMinutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delayMinutes: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Wait this long before checking and triggering fallback
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">
              Preview
            </h3>
            <p className="text-sm text-blue-800">
              When a message on <strong>{formData.primaryChannel.toUpperCase()}</strong> is{" "}
              <strong>
                {formData.triggerCondition === "undelivered"
                  ? "not delivered"
                  : formData.triggerCondition === "unread"
                  ? "not read/opened"
                  : "bounced/failed"}
              </strong>{" "}
              after <strong>{formData.delayMinutes} minutes</strong>, it will
              automatically be resent via{" "}
              <strong>{formData.fallbackChannel.toUpperCase()}</strong>.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Fallback Rule"}
            </button>
            <Link
              href="/dashboard/automation"
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
