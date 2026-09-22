import React, { useState } from "react";
import {
  Heart,
  Activity,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { BG_PATTERN_URL } from "../utils/helpers";

export default function AdminLoginScreen({ onLogin, onBack }) {
  const [form, setForm] = useState({ username: "", password: "", role: "admin" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Submit Admin/Hospital Login to FastAPI Backend
  const submit = async () => {
    if (!form.username.trim() || !form.password) {
      setError("Please enter both credentials.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.username.trim(),
          password: form.password,
          role: form.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Incorrect administrator credentials.");
      }

      // Save token and state
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message || "Failed to reach authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10"
      style={{ backgroundImage: BG_PATTERN_URL, backgroundRepeat: "repeat" }}
    >
      <div className="w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-emerald-950/10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative hidden overflow-hidden bg-emerald-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[24px] border-emerald-700/60" />
            <div className="relative">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-red-600 shadow-lg">
                <Heart className="h-7 w-7" fill="currentColor" />
                <Activity className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-emerald-500 p-1 text-white ring-4 ring-emerald-900" />
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">LIFE LINK</p>
              <h1 className="mt-3 max-w-sm text-4xl font-bold leading-tight">Care that stays close when it matters.</h1>
              <p className="mt-5 max-w-sm text-sm leading-6 text-emerald-100">Triage symptoms, find nearby care, and reach emergency help from one calm, connected place.</p>
            </div>
            <div className="relative flex items-center gap-3 border-t border-white/15 pt-5 text-xs text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" /> Secure access for your care journey
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-800 text-red-500 shadow-lg">
                <Heart className="h-6 w-6" fill="currentColor" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900">LIFE LINK</h1>
                <p className="text-xs text-stone-500">Care that stays close.</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Secure access</p>
              <h2 className="mt-1 text-2xl font-bold text-stone-900">LIFE LINK Portal</h2>
              <p className="mt-1 text-sm text-stone-500">Hospital, Doctor & Administrator Access</p>
            </div>

            <div
              className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/60"
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            >
              <div className="bg-white px-5 py-6 sm:px-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Access Portal Type</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    >
                      <option value="hospital">Hospital</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">System Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Username or Email</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        placeholder="e.g. staff@lifelink.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-stone-600">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-xs font-medium text-red-600">{error}</p>}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Sign in to dashboard
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onBack}
              className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-emerald-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to user login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}