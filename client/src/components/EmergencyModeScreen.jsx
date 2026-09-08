import React, { useState, useEffect } from "react";
import {
  Siren,
  ArrowLeft,
  Phone,
  ChevronRight,
  MapPinned,
  Navigation,
  MessageCircle,
  Send,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { EMERGENCY_CONTACTS_SEED, TRAUMA_CENTER } from "../data/constants";

export default function EmergencyModeScreen({ onExit, t }) {
  const [coords, setCoords] = useState({ lat: TRAUMA_CENTER.lat, lng: TRAUMA_CENTER.lng, source: "estimated" });
  const [contacts, setContacts] = useState(EMERGENCY_CONTACTS_SEED);
  const [broadcasting, setBroadcasting] = useState(false);
  const [message, setMessage] = useState(
    "EMERGENCY — I need urgent medical help. This is my live location, please come or send help immediately: "
  );

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: "live" }),
        () => {
          /* fall back silently to the estimated coordinates already set */
        },
        { timeout: 4000 }
      );
    }
  }, []);

  const locationLink = `https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  const fullMessage = `${message}${locationLink}`;

  const notifyAll = () => {
    setBroadcasting(true);
    setTimeout(() => {
      setContacts((cs) => cs.map((c) => ({ ...c, status: "notified" })));
      setBroadcasting(false);
    }, 1400);
  };

  const notifyOne = (id) => {
    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, status: "notified" } : c)));
  };

  return (
    <div className="min-h-screen bg-red-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Siren className="h-6 w-6 text-red-400" />
            <span className="text-lg font-bold tracking-tight">Emergency Mode</span>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-md border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.exitEmergency}
          </button>
        </div>

        {/* Call ambulance */}
        <a
          href="tel:108"
          className="mt-6 flex items-center justify-between rounded-xl border-2 border-red-400 bg-red-600 px-5 py-5 shadow-lg shadow-red-900/50 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <Phone className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-red-100">Tap to call now</p>
              <p className="text-2xl font-bold">Ambulance · 108</p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </a>

        {/* Trauma center */}
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-900/50 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-300">
            <MapPinned className="h-3.5 w-3.5" /> Nearest trauma center
          </p>
          <p className="mt-1.5 font-semibold text-white">{TRAUMA_CENTER.name}</p>
          <p className="mt-0.5 text-sm text-red-200">
            {TRAUMA_CENTER.distance} away · ETA {TRAUMA_CENTER.eta}
          </p>
          <p className="mt-1 text-xs text-red-300">
            Your location ({coords.source}): {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
          <a
            href={`https://maps.google.com/?daddr=${TRAUMA_CENTER.lat},${TRAUMA_CENTER.lng}&saddr=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50"
          >
            <Navigation className="h-4 w-4" /> Get directions
          </a>
        </div>

        {/* Broadcast */}
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-900/50 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-300">
            <MessageCircle className="h-3.5 w-3.5" /> Broadcast emergency message
          </p>
          <textarea
            value={fullMessage}
            onChange={(e) => setMessage(e.target.value.replace(locationLink, ""))}
            rows={3}
            className="mt-2 w-full resize-none rounded-md border border-red-400/40 bg-red-950/60 p-2.5 text-sm text-red-50 outline-none focus:border-red-300"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(fullMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={`sms:?body=${encodeURIComponent(fullMessage)}`}
              className="flex items-center justify-center gap-1.5 rounded-md bg-white py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50"
            >
              <Send className="h-4 w-4" /> SMS
            </a>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-900/50 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-300">
              <ShieldAlert className="h-3.5 w-3.5" /> Emergency contacts
            </p>
            <button
              onClick={notifyAll}
              disabled={broadcasting}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
            >
              {broadcasting ? "Notifying…" : "Notify all"}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md bg-red-950/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-red-50">{c.name}</p>
                  <p className="text-xs text-red-300">{c.phone}</p>
                </div>
                {c.status === "notified" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Notified
                  </span>
                ) : (
                  <button
                    onClick={() => notifyOne(c.id)}
                    className="rounded-md border border-red-400/40 px-2.5 py-1 text-xs text-red-100 hover:bg-red-900"
                  >
                    Notify
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-red-300/80">
          LIFE LINK Emergency Mode surfaces the fastest paths to help. It does not dispatch emergency services on
          its own — calling 108 is the fastest way to get an ambulance moving.
        </p>
      </div>
    </div>
  );
}

