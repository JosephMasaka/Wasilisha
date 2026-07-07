"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ConvergenceOrbit from "@/components/ConvergenceOrbit";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: "var(--surface-2)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: "var(--bg)" }}>
      <div className="hidden lg:flex flex-col justify-between p-12 border-r" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="font-display text-xl italic" style={{ color: "var(--text)" }}>
          Wasilisha
        </Link>
        <div className="animate-fade-up">
          <ConvergenceOrbit size={180} />
          <h2 className="font-display text-3xl mt-8 mb-4" style={{ color: "var(--text)" }}>
            Welcome <span className="italic" style={{ color: "var(--primary)" }}>back.</span>
          </h2>
          <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
            Your campaigns, contacts, and wallet — right where you left them.
          </p>
        </div>
        <div className="flex gap-3 text-xs" style={{ color: "var(--text-faint)" }}>
          <span>Africa&apos;s Talking</span>·<span>Resend</span>·<span>Meta WhatsApp</span>·<span>Paystack</span>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="font-display text-xl italic" style={{ color: "var(--text)" }}>
              Wasilisha
            </Link>
          </div>
          <h1 className="font-display text-3xl mb-2" style={{ color: "var(--text)" }}>
            Sign in
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Welcome back to Wasilisha.
          </p>

          {searchParams.get("registered") === "true" && (
            <div
              className="text-sm p-3 rounded-lg mb-5 border"
              style={{ background: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.25)", color: "var(--whatsapp)" }}
            >
              Account created successfully! Please sign in.
            </div>
          )}
          {error && (
            <div
              className="text-sm p-3 rounded-lg mb-5 border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                style={{ ...inputStyle, ["--tw-ring-color" as string]: "var(--primary)" }}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-11 rounded-lg border text-sm focus:outline-none focus:ring-2 transition"
                  style={{ ...inputStyle, ["--tw-ring-color" as string]: "var(--primary)" }}
                  placeholder="Your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "var(--text-faint)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, var(--warm), var(--primary))", color: "white", marginTop: "0.5rem" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center mt-8 text-sm" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium hover:underline" style={{ color: "var(--primary)" }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg)", minHeight: "100vh" }} />}>
      <SignInForm />
    </Suspense>
  );
}