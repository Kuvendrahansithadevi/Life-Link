import React, { useState } from "react";
import {
  Heart,
  Activity,
  User,
  Lock,
  Mail,
  Home,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  Loader2,
  MapPin,
} from "lucide-react";
import { BG_PATTERN_URL } from "../utils/helpers";

export default function AuthScreen({ onLogin, onSignup, onGoToAdmin, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // login | signup
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    address: "",
    lat: null,
    lng: null,
  });

  const switchMode = (m) => {
    setMode(m);
    setError("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location services are not available in this browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude, longitude } = coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const data = await response.json();

          if (!response.ok || !data.display_name) {
            throw new Error("We couldn't determine a readable address for this location.");
          }

          setSignupForm((current) => ({
            ...current,
            address: data.display_name,
            lat: latitude,
            lng: longitude,
          }));
        } catch (err) {
          setError(err.message || "Unable to fetch your current address.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        setError("Unable to access your current location. Please allow location access or enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  // 1. Submit Login to FastAPI Backend
  const submitLogin = async () => {
    if (!loginForm.username.trim() || !loginForm.password) {
      setError("Please provide both username and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginForm.username.trim(), // Supports username or email
          password: loginForm.password,
          role: "user",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "We couldn't find an account with those credentials.");
      }

      // Save token and pass logged in user object/ID
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message || "Failed to log in. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Signup to FastAPI Backend & MongoDB
  const submitSignup = async () => {
    if (
      !signupForm.username.trim() ||
      !signupForm.email.trim() ||
      !signupForm.password ||
      !signupForm.address.trim()
    ) {
      setError("Please fill in every field to create your account.");
      return;
    }

    if (signupForm.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupForm.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signupForm.username.trim(),
          email: signupForm.email.trim(),
          password: signupForm.password,
          address: signupForm.address.trim(),
          lat: signupForm.lat,
          lng: signupForm.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed. Try a different username or email.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onSignup) {
        onSignup(data.user);
      }
    } catch (err) {
      setError(err.message || "Failed to create account. Make sure backend is running.");
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
            <div className="mb-5 hidden lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Welcome back</p>
              <h2 className="mt-1 text-2xl font-bold text-stone-900">Continue to your care hub</h2>
              <p className="mt-1 text-sm text-stone-500">Sign in or create an account to get started.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50/60">
          <div className="flex border-b border-stone-200">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-3 text-sm font-semibold ${
                mode === "login"
                  ? "border-b-2 border-emerald-700 text-emerald-800"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-3 text-sm font-semibold ${
                mode === "signup"
                  ? "border-b-2 border-emerald-700 text-emerald-800"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="bg-white px-5 py-6 sm:px-6">
            {mode === "login" ? (
              <div
                className="space-y-4"
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitLogin();
                }}
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">Username or Email</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="e.g. asha.rao or asha@example.com"
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
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Log in
                </button>
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
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                    <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={signupForm.address}
                      onChange={(e) => setSignupForm({ ...signupForm, address: e.target.value, lat: null, lng: null })}
                      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      placeholder="House / street, area, city"
                    />
                    </div>
                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locationLoading || loading}
                      title="Use current location"
                      aria-label="Use current location"
                      className="flex shrink-0 items-center justify-center rounded-lg border border-stone-300 px-3 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs font-medium text-red-600">{error}</p>}

                <button
                  type="button"
                  onClick={submitSignup}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create account
                </button>
              </div>
            )}
          </div>
            </div>

            <button
              onClick={onGoToAdmin}
              className="mt-5 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-stone-500 transition-colors hover:text-emerald-800"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Hospital / administrator login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}