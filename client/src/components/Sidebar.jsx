import React from "react";
import {
  Heart,
  Activity,
  ChevronRight,
  Stethoscope,
  Building2,
  Droplet,
  User,
  Siren,
  LogOut,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { initialsOf } from "../utils/helpers";

function SidebarButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-white text-emerald-800 shadow-sm" : "text-emerald-50 hover:bg-white/10"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export default function Sidebar({ tab, setTab, language, setLanguage, t, onEmergency, currentUser, onLogout }) {
  return (
    <aside className="sticky top-0 z-30 flex h-screen w-72 shrink-0 flex-col bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900 shadow-sm sm:w-80">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-md">
          <Heart className="h-5 w-5" fill="currentColor" />
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-emerald-800">
            <Activity className="h-2.5 w-2.5 text-white" />
          </span>
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold leading-none tracking-tight text-white">LIFE LINK</p>
          <p className="mt-0.5 truncate text-xs text-emerald-100">{t.tagline}</p>
        </div>
      </div>

      {/* Signed-in user */}
      <button
        onClick={() => setTab("profile")}
        className="flex items-center gap-3 border-b border-white/10 px-5 py-4 text-left hover:bg-white/5"
      >
        {currentUser.profileImage ? (
          <img
            src={currentUser.profileImage}
            alt={currentUser.username}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white ring-2 ring-white/20">
            {initialsOf(currentUser.username)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{currentUser.username}</p>
          <p className="truncate text-xs text-emerald-200">
            {currentUser.isDonor ? "Registered donor" : "View profile"}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-emerald-200" />
      </button>

      {/* Modules */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Modules</p>
        <SidebarButton icon={Stethoscope} label={t.navTriage} active={tab === "triage"} onClick={() => setTab("triage")} />
        <SidebarButton icon={Building2} label={t.navHospitals} active={tab === "hospitals"} onClick={() => setTab("hospitals")} />
        <SidebarButton icon={Droplet} label={t.navBlood} active={tab === "blood"} onClick={() => setTab("blood")} />
        <SidebarButton icon={User} label={t.navProfile} active={tab === "profile"} onClick={() => setTab("profile")} />
      </nav>

      {/* Language + Emergency + Logout */}
      <div className="space-y-3 border-t border-white/10 px-3 py-4">
        <div>
          <p className="px-1 pb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300/80">Language</p>
          <LanguageSelector language={language} setLanguage={setLanguage} variant="sidebar" />
        </div>
        <button
          onClick={onEmergency}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/40 ring-1 ring-red-400/40 hover:bg-red-500"
        >
          <Siren className="h-[18px] w-[18px] shrink-0" />
          <span>{t.emergencyBtn}</span>
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 py-2.5 text-sm font-medium text-emerald-50 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          {t.logout}
        </button>
      </div>
    </aside>
  );
}

