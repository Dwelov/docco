"use client";

import { useState } from "react";

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        // Surface the real server error so misconfiguration is visible
        let msg = "Wrong password. Try again.";
        try {
          const body = await res.json() as { error?: string };
          if (res.status !== 401 && body.error) {
            msg = `Server error: ${body.error}`;
          }
        } catch { /* ignore */ }
        setError(msg);
        return;
      }
      setPassword("");
      onSuccess();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="mb-4 text-center text-xl font-bold text-black">Admin login</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-black">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490]"
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={saving || password.length === 0}
          className="w-full rounded-full bg-[#0E7490] px-5 py-2 text-sm font-medium text-white hover:bg-[#0c637b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
