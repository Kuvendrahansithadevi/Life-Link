import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  MapPin,
  Search,
  BadgeCheck,
  Clock,
  Calendar,
} from "lucide-react";
import { HOSPITALS } from "../data/constants";

function BookingModal({ hospital, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", specialist: hospital.specialists[0] });
  const [confirmed, setConfirmed] = useState(false);
  const [appointmentId] = useState(() => "LL-" + Math.floor(100000 + Math.random() * 900000));

  const submit = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time) return;
    setConfirmed(true);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-stone-900">
            {confirmed ? "Appointment confirmed" : "Book appointment"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-stone-500 hover:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!confirmed ? (
          <div
            className="space-y-4 px-5 py-5"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          >
            <p className="text-sm text-stone-600">{hospital.name}</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Full name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Phone number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                placeholder="+91"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Specialist</label>
              <select
                value={form.specialist}
                onChange={(e) => setForm({ ...form, specialist: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              >
                {hospital.specialists.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={submit}
              className="w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
            >
              Confirm booking
            </button>
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <p className="mt-3 text-sm text-stone-700">
              Your appointment with <span className="font-medium">{hospital.name}</span> is booked for{" "}
              <span className="font-medium">
                {form.date} at {form.time}
              </span>{" "}
              with {form.specialist}.
            </p>
            <p className="mt-2 text-xs text-stone-500">Confirmation ID: {appointmentId}</p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-md border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HospitalDirectory() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = HOSPITALS.filter((h) => {
    const q = query.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      h.specialists.some((s) => s.toLowerCase().includes(q)) ||
      h.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900">Find nearby care</h1>
      <p className="mt-1 text-sm text-stone-600">Hospitals and specialists near you, ranked by distance.</p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by hospital, specialty, or area"
          className="w-full rounded-lg border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
            No hospitals match "{query}". Try a different specialty or area.
          </p>
        )}
        {filtered.map((h) => (
          <div
            key={h.id}
            className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
              h.availableNow ? "border-emerald-100" : "border-stone-200"
            }`}
          >
            <div className={`h-1 w-full ${h.availableNow ? "bg-emerald-500" : "bg-stone-300"}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-stone-900">{h.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5" /> {h.address} · {h.distance}
                  </p>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    h.availableNow ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${h.availableNow ? "bg-emerald-500" : "bg-red-400"}`} />
                  {h.availableNow ? "Available now" : "Fully booked"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {h.specialists.map((s) => (
                  <span key={s} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {h.rating} rating
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> ~{h.waitTime} wait
                  </span>
                </div>
                <button
                  onClick={() => setSelected(h)}
                  disabled={!h.availableNow}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-300"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && <BookingModal hospital={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

