import React, { useState } from "react";
import { Globe, ChevronRight } from "lucide-react";
import { LANGUAGES } from "../data/constants";

export default function LanguageSelector({ language, setLanguage, variant = "header" }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === language);

  if (variant === "sidebar") {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium text-white hover:bg-white/20"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4 shrink-0" />
            {current.label}
          </span>
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </button>
        {open && (
          <div className="mt-1 space-y-0.5 overflow-hidden rounded-lg bg-emerald-950/40 p-1">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLanguage(l.code);
                  setOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-1.5 text-left text-sm ${
                  l.code === language ? "bg-white/20 font-semibold text-white" : "text-emerald-100 hover:bg-white/10"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1.5 text-sm text-white backdrop-blur hover:bg-white/20"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-stone-50 ${
                l.code === language ? "bg-emerald-50 text-emerald-800 font-medium" : "text-stone-700"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

