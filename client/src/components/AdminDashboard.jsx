import React, { useEffect, useState } from "react";
import {
  Heart,
  Activity,
  LogOut,
  Users,
  Droplet,
  ClipboardList,
  Building2,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Clock,
  BadgeCheck,
} from "lucide-react";
import { BG_PATTERN_URL } from "../utils/helpers";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-stone-900">{value}</p>
    </div>
  );
}

const emptyHospitalForm = {
  name: "",
  address: "",
  phone: "",
  specialists: "",
  lat: "",
  lng: "",
  total_beds: "0",
  icu_beds: "0",
  available_beds: "0",
  waitTime: "15 min",
  rating: "4.5",
  availableNow: true,
};

export default function AdminDashboard({ users, requests, onLogout }) {
  const donors = users.filter((u) => u.isDonor);

  const [hospitalForm, setHospitalForm] = useState(emptyHospitalForm);
  const [hospitals, setHospitals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const loadHospitals = async () => {
    try {
      const response = await fetch("/api/hospitals");
      if (!response.ok) throw new Error("Could not load hospitals.");
      setHospitals(await response.json());
    } catch (err) {
      setError(err.message || "Could not load hospitals.");
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const submitHospital = async () => {
    if (!hospitalForm.name.trim() || !hospitalForm.address.trim() || !hospitalForm.lat || !hospitalForm.lng) return;
    const specialistsList = hospitalForm.specialists
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: hospitalForm.name.trim(),
      address: hospitalForm.address.trim(),
      phone: hospitalForm.phone.trim(),
      specialists: specialistsList.length ? specialistsList : ["General Physician"],
      lat: Number(hospitalForm.lat),
      lng: Number(hospitalForm.lng),
      total_beds: Number(hospitalForm.total_beds),
      icu_beds: Number(hospitalForm.icu_beds),
      available_beds: Number(hospitalForm.available_beds),
      available_now: hospitalForm.availableNow,
      rating: Number(hospitalForm.rating),
      wait_time: hospitalForm.waitTime.trim() || "15 min",
    };

    try {
      const response = await fetch(editingId ? `/api/hospitals/${editingId}` : "/api/hospitals", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Could not save hospital.");
      await loadHospitals();
      setHospitalForm(emptyHospitalForm);
      setEditingId(null);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      setError(err.message || "Could not save hospital.");
    }
  };

  const editHospital = (hospital) => {
    setEditingId(hospital.id);
    setHospitalForm({
      ...emptyHospitalForm,
      ...hospital,
      specialists: (hospital.specialists || []).join(", "),
      waitTime: hospital.wait_time || "15 min",
      availableNow: hospital.available_now ?? true,
    });
  };

  const deleteHospital = async (id) => {
    try {
      const response = await fetch(`/api/hospitals/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete hospital.");
      setHospitals((current) => current.filter((hospital) => hospital.id !== id));
    } catch (err) {
      setError(err.message || "Could not delete hospital.");
    }
  };

  return (
    <div
      className="min-h-screen bg-stone-50 text-stone-900"
      style={{ backgroundImage: BG_PATTERN_URL, backgroundRepeat: "repeat" }}
    >
      <div className="border-b border-stone-200 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-red-500 shadow-md">
              <Heart className="h-5 w-5" fill="currentColor" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <Activity className="h-2.5 w-2.5 text-white" />
              </span>
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight text-stone-900">LIFE LINK Admin</p>
              <p className="text-xs text-stone-500">Network overview & hospital management</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-xl font-semibold text-stone-900">Network overview</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label="Registered users" value={users.length} accent="bg-emerald-600" />
          <StatCard icon={Droplet} label="Registered donors" value={donors.length} accent="bg-red-600" />
          <StatCard icon={ClipboardList} label="Active blood requests" value={requests.length} accent="bg-amber-600" />
          <StatCard icon={Building2} label="Partner hospitals" value={hospitals.length} accent="bg-sky-600" />
        </div>

        {/* Add a hospital */}
        <div className="mt-8 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Plus className="h-4 w-4 text-emerald-700" /> Add a hospital
          </h2>
          <p className="mb-4 text-xs text-stone-500">
            New hospitals appear immediately in users' "Find Care" directory, ready for appointment booking.
          </p>
          {error && <p className="mb-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitHospital();
            }}
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Hospital name</label>
              <input
                value={hospitalForm.name}
                onChange={(e) => setHospitalForm({ ...hospitalForm, name: e.target.value })}
                placeholder="e.g. City Care Hospital"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Address</label>
              <input
                value={hospitalForm.address}
                onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                placeholder="Street, area, city"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Latitude</label>
              <input type="number" step="any" value={hospitalForm.lat} onChange={(e) => setHospitalForm({ ...hospitalForm, lat: e.target.value })} placeholder="13.8285" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Longitude</label>
              <input type="number" step="any" value={hospitalForm.lng} onChange={(e) => setHospitalForm({ ...hospitalForm, lng: e.target.value })} placeholder="77.4913" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Phone number</label>
              <input
                value={hospitalForm.phone}
                onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                placeholder="+91"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Typical wait time</label>
              <input
                value={hospitalForm.waitTime}
                onChange={(e) => setHospitalForm({ ...hospitalForm, waitTime: e.target.value })}
                placeholder="e.g. 15 min"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Rating</label>
              <input type="number" min="0" max="5" step="0.1" value={hospitalForm.rating} onChange={(e) => setHospitalForm({ ...hospitalForm, rating: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Total beds</label>
              <input type="number" min="0" value={hospitalForm.total_beds} onChange={(e) => setHospitalForm({ ...hospitalForm, total_beds: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">ICU beds</label>
              <input type="number" min="0" value={hospitalForm.icu_beds} onChange={(e) => setHospitalForm({ ...hospitalForm, icu_beds: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Available beds</label>
              <input type="number" min="0" value={hospitalForm.available_beds} onChange={(e) => setHospitalForm({ ...hospitalForm, available_beds: e.target.value })} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Specialists (comma separated)</label>
              <input
                value={hospitalForm.specialists}
                onChange={(e) => setHospitalForm({ ...hospitalForm, specialists: e.target.value })}
                placeholder="e.g. Cardiologist, General Physician, Pediatrician"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={hospitalForm.availableNow}
                onChange={(e) => setHospitalForm({ ...hospitalForm, availableNow: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-600"
              />
              Available for booking now
            </label>
          </div>
          <button
            type="button"
            onClick={submitHospital}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 sm:w-auto sm:px-6"
          >
            <Plus className="h-4 w-4" /> {editingId ? "Update hospital" : "Add hospital"}
          </button>
          {added && (
            <p className="mt-2 text-xs font-medium text-emerald-700">
              Hospital added — it now appears in the user app's "Find Care" directory.
            </p>
          )}
        </div>

        {/* Current hospitals */}
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-stone-800">Partner hospitals ({hospitals.length})</h2>
          <div className="space-y-2">
            {hospitals.map((h) => (
              <div
                key={h.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-stone-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-900">{h.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {h.address}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" /> {h.rating} rating
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> ~{h.wait_time || h.waitTime}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        (h.available_now ?? h.availableNow) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}
                    >
                      {(h.available_now ?? h.availableNow) ? "Available now" : "Fully booked"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => editHospital(h)} className="flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-50">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => deleteHospital(h.id)} className="flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
