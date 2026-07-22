"use client";

import { useState } from "react";

interface WalletCardProps {
  balance: string;
  companyId: string;
}

export default function WalletCard({ balance, companyId }: WalletCardProps) {
  const [showTopup, setShowTopup] = useState(false);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate top-up");
      }

      setSuccess(
        "M-Pesa prompt sent! Please complete the payment on your phone. Your balance will update automatically."
      );
      setAmount("");
      setPhone("");
      setTimeout(() => {
        setShowTopup(false);
        setSuccess("");
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--primary)] rounded-lg shadow-lg p-6 text-white">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-medium text-primary-100 mb-1">
            Wallet Balance
          </div>
          <div className="text-4xl font-bold mb-4">
            KES {parseFloat(balance).toFixed(2)}
          </div>
          <button
            onClick={() => setShowTopup(!showTopup)}
            className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition"
          >
            Top Up Wallet
          </button>
        </div>
      </div>

      {showTopup && (
        <div className="mt-6 pt-6 border-t border-primary-500">
          <h3 className="text-lg font-semibold mb-4">Top Up via M-Pesa</h3>

          {error && (
            <div className="bg-red-500 text-white p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500 text-white p-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleTopup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-100 mb-1">
                Amount (KES)
              </label>
              <input
                type="number"
                required
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-white"
                placeholder="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-100 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-gray-900 focus:ring-2 focus:ring-white"
                placeholder="0712345678"
              />
              <p className="text-xs text-primary-100 mt-1">
                Enter your M-Pesa registered number
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-white text-primary-600 py-2 rounded-lg font-semibold hover:bg-primary-50 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Send M-Pesa Prompt"}
              </button>
              <button
                type="button"
                onClick={() => setShowTopup(false)}
                className="px-4 py-2 border border-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
