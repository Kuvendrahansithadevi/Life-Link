import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  MapPin,
  Search,
  BadgeCheck,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

export function BookingModal({ hospital, onClose, initialSpecialist }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    specialist: initialSpecialist && hospital.specialists?.includes(initialSpecialist)
      ? initialSpecialist
      : hospital.specialists?.[0] || "General Physician",
  });
  const [confirmed, setConfirmed] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.date || !form.time) return;

    setSubmitting(true);
    setBookingError(null);

    try {
      const response = await fetch("http://localhost:8000/api/hospitals/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hospital.id,
          hospital_name: hospital.name,
          patient_name: form.name.trim(),
          phone: form.phone.trim(),
          specialist: form.specialist,
          date: form.date,
          time: form.time,
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed. Please try again.");
      }

      const data = await response.json();
      setAppointmentId(data.booking_id || data.appointment_id || "LL-" + Math.floor(100000 + Math.random() * 900000));
      setConfirmed(true);
    } catch (err) {
      console.error("Booking error:", err);
      setBookingError(err.message || "Failed to confirm booking.");
    } finally {
      setSubmitting(false);
    }
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
            <p className="text-sm font-medium text-stone-800">{hospital.name}</p>

            {bookingError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

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
                {hospital.specialists?.map((s) => (
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
              disabled={submitting || !form.name.trim() || !form.phone.trim() || !form.date || !form.time}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-300"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm booking"}
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

export default function HospitalDirectory({ currentUser }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Hospitals from FastAPI Backend using live coordinates
  useEffect(() => {
    let isMounted = true;

    async function fetchHospitals(lat, lng) {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (lat != null && lng != null) {
          params.set("lat", lat);
          params.set("lng", lng);
        }
        const response = await fetch(`/api/hospitals?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        if (isMounted) setHospitals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Backend hospital list unavailable:", err);
        if (isMounted) setHospitals([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (currentUser?.lat != null && currentUser?.lng != null) {
      fetchHospitals(currentUser.lat, currentUser.lng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchHospitals(pos.coords.latitude, pos.coords.longitude),
        () => fetchHospitals()
      );
    } else {
      fetchHospitals();
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser?.lat, currentUser?.lng]);

  const filtered = hospitals.filter((h) => {
    const q = query.toLowerCase();
    return (
      (h.name && h.name.toLowerCase().includes(q)) ||
      (h.specialists && h.specialists.some((s) => s.toLowerCase().includes(q))) ||
      (h.address && h.address.toLowerCase().includes(q))
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

      {loading ? (
        <div className="mt-10 flex flex-col items-center justify-center py-12 text-stone-500">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-2 text-xs">Finding nearest hospitals...</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.length === 0 && (
            <p className="rounded-lg border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
              No hospitals match "{query}". Try a different specialty or area.
            </p>
          )}
          {filtered.map((h) => {
            const isAvailable = h.available_now ?? h.availableNow ?? true;
            const distance = h.distance_km ? `${h.distance_km.toFixed(1)} km` : h.distance || "Nearby";
            const waitTime = h.wait_time || h.waitTime || "15 min";

            return (
              <div
                key={h.id || h._id}
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                  isAvailable ? "border-emerald-100" : "border-stone-200"
                }`}
              >
                <div className={`h-1 w-full ${isAvailable ? "bg-emerald-500" : "bg-stone-300"}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-stone-900">{h.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                        <MapPin className="h-3.5 w-3.5" /> {h.address} · {distance}
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-red-400"}`} />
                      {isAvailable ? "Available now" : "Fully booked"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {h.specialists?.map((s) => (
                      <span key={s} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {h.rating || 4.5} rating
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> ~{waitTime} wait
                      </span>
                    </div>
                    <button
                      onClick={() => setSelected(h)}
                      disabled={!isAvailable}
                      className="flex items-center gap-1 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-300"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Book
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && <BookingModal hospital={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}