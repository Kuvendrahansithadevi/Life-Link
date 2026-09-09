import React, { useState } from "react";
import {
  Heart,
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
} from "lucide-react";
import { ADMIN_CREDENTIALS } from "../data/constants";
import { BG_PATTERN_URL } from "../utils/helpers";

export default function AdminLoginScreen({ onLogin, onBack }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (form.username === ADMIN_CREDENTIALS.username && form.password === ADMIN_CREDENTIALS.password) {
      onLogin();
    } else {
      setError("Incorrect administrator credentials.");
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10"
      style={{ backgroundImage: BG_PATTERN_URL, backgroundRepeat: "repeat" }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-emerald-300 shadow-lg">
            <ShieldCheck className="h-7 w-7" />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 ring-2 ring-white">
              <Heart className="h-2.5 w-2.5 text-white" fill="currentColor" />
            </span>
          </span>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-stone-900">LIFE LINK Admin</h1>
          <p className="mt-1 text-sm text-stone-500">Access is provisioned by system administrators only.</p>
        </div>

        <div
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-emerald-900/5"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Admin username</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                placeholder="admin"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Password</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
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
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
          >
            <LogIn className="h-4 w-4" /> Sign in to dashboard
          </button>
          <p className="text-center text-xs text-stone-500">
            Demo — username <span className="font-mono font-medium text-stone-700">admin</span>, password{" "}
            <span className="font-mono font-medium text-stone-700">admin@108</span>
          </p>
        </div>

        <button
          onClick={onBack}
          className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-emerald-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to user login
        </button>
      </div>
    </div>
  );
}
