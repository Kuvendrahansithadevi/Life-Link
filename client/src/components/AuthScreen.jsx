import React, { useState } from "react";
import {
  Heart,
  User,
  Lock,
  Mail,
  Home,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
} from "lucide-react";
import { BG_PATTERN_URL } from "../utils/helpers";

export default function AuthScreen({ users, onLogin, onSignup, onGoToAdmin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({ username: "", email: "", password: "", address: "" });

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const submitLogin = () => {
    const match = users.find(
      (u) => u.username.toLowerCase() === loginForm.username.trim().toLowerCase() && u.password === loginForm.password
    );
    if (!match) {
      setError("We couldn't find an account with that username and password.");
      return;
    }
    onLogin(match.id);
  };

  const submitSignup = () => {
    const taken = users.some((u) => u.username.toLowerCase() === signupForm.username.trim().toLowerCase());
    if (taken) {
      setError("That username is already registered. Try logging in instead.");
      return;
    }
    if (!signupForm.username.trim() || !signupForm.email.trim() || !signupForm.password || !signupForm.address.trim()) {
      setError("Please fill in every field to create your account.");
      return;
    }
    onSignup({
      id: "u" + Date.now(),
      username: signupForm.username.trim(),
      email: signupForm.email.trim(),
      password: signupForm.password,
      address: signupForm.address.trim(),
      phone: "",
      bloodGroup: "O+",
      profileImage: null,
      isDonor: false,
      joined: "Just now",
    });
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10"
      style={{ backgroundImage: BG_PATTERN_URL, backgroundRepeat: "repeat" }}
    >
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-red-500 shadow-lg">
            <Heart className="h-7 w-7" fill="currentColor" />
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900">LIFE LINK</h1>
          <p className="mt-1 text-sm text-stone-500">Every second, we're with you.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-emerald-900/5">
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-3 text-sm font-semibold ${
                mode === "login" ? "border-b-2 border-emerald-700 text-emerald-800" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-3 text-sm font-semibold ${
                mode === "signup" ? "border-b-2 border-emerald-700 text-emerald-800" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="px-6 py-6">
            {mode === "login" ? (
              <div
                className="space-y-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitLogin();
                }}
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Username</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="e.g. asha.rao"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
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
                  onClick={submitLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
                >
                  <LogIn className="h-4 w-4" /> Log in
                </button>
                <p className="text-center text-xs text-stone-500">
                  Demo account — username <span className="font-mono font-medium text-stone-700">asha.rao</span>, password{" "}
                  <span className="font-mono font-medium text-stone-700">password123</span>
                </p>
              </div>
            ) : (
              <div
                className="space-y-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitSignup();
                }}
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Username</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={signupForm.username}
                      onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="Create a password"
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
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Address</label>
                  <div className="relative">
                    <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={signupForm.address}
                      onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="House / street, area, city"
                    />
                  </div>
                </div>
                {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                <button
                  type="button"
                  onClick={submitSignup}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
                >
                  <UserPlus className="h-4 w-4" /> Create account
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onGoToAdmin}
          className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-stone-500 hover:text-emerald-800"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Hospital / administrator login
        </button>
      </div>
    </div>
  );
}

