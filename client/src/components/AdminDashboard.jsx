import React, { useEffect, useState } from "react";
import {
  Heart,
  Activity,
  LogOut,
  Users,
  Droplet,
  ClipboardList,
  Building2,
  Stethoscope,
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
  city: "",
  phone: "",
  description: "",
  conditions: "",
  specializations: "",
  specialists: "",
  lat: "",
  lng: "",
  total_beds: "0",
  icu_beds: "0",
  available_beds: "0",
  waitTime: "15 min",
  rating: "4.5",
  availableNow: true,
  staffEmail: "",
  temporaryPassword: "",
};

const emptyDoctorForm = { name: "", specialization: "General Physician", email: "" };

export default function AdminDashboard({ users, requests, onLogout }) {
  const donors = users.filter((u) => u.isDonor);

  const [hospitalForm, setHospitalForm] = useState(emptyHospitalForm);
  const [hospitals, setHospitals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [added, setAdded] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState("");
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [doctors, setDoctors] = useState([]);
  const [doctorCredentials, setDoctorCredentials] = useState(null);

  const adminHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

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
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await fetch("/api/admin/doctors", { headers: adminHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load doctors.");
      setDoctors(data.doctors || []);
    } catch (err) {
      setError(err.message || "Could not load doctors.");
    }
  };

  const submitDoctor = async () => {
    if (!doctorForm.name.trim() || !doctorForm.specialization.trim() || !doctorForm.email.trim()) {
      setError("Doctor name, specialization, and email are required.");
      return;
    }
    try {
      const response = await fetch("/api/admin/doctors/add", {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({
          name: doctorForm.name.trim(),
          specialization: doctorForm.specialization.trim(),
          email: doctorForm.email.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not add doctor.");
      setDoctors((current) => [data.doctor, ...current]);
      setDoctorCredentials({ ...data.credentials, loginToken: data.loginToken });
      setDoctorForm(emptyDoctorForm);
      setError("");
    } catch (err) {
      setError(err.message || "Could not add doctor.");
    }
  };

  const submitHospital = async () => {
    if (!hospitalForm.name.trim() || !hospitalForm.address.trim() || !hospitalForm.lat || !hospitalForm.lng) return;
    if (!editingId && (!hospitalForm.staffEmail.trim() || !hospitalForm.temporaryPassword)) {
      setError("Staff email and default password are required when adding a hospital.");
      return;
    }
    const specialistsList = hospitalForm.specialists
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      name: hospitalForm.name.trim(),
      address: hospitalForm.address.trim(),
      city: hospitalForm.city.trim(),
      phone: hospitalForm.phone.trim(),
      description: hospitalForm.description.trim(),
      conditions: hospitalForm.conditions.split(",").map((item) => item.trim()).filter(Boolean),
      specializations: hospitalForm.specializations.split(",").map((item) => item.trim()).filter(Boolean),
      specialists: specialistsList.length ? specialistsList : ["General Physician"],
      lat: Number(hospitalForm.lat),
      lng: Number(hospitalForm.lng),
      total_beds: Number(hospitalForm.total_beds),
      icu_beds: Number(hospitalForm.icu_beds),
      available_beds: Number(hospitalForm.available_beds),
      available_now: hospitalForm.availableNow,
      rating: Number(hospitalForm.rating),
      wait_time: hospitalForm.waitTime.trim() || "15 min",
      ...(editingId ? {} : {
        staffEmail: hospitalForm.staffEmail.trim(),
        temporaryPassword: hospitalForm.temporaryPassword,
      }),
    };

    try {
      const response = await fetch(editingId ? `/api/hospitals/${editingId}` : "/api/hospitals", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Hospital save failed", {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
          payload,
        });
        const detail = responseData?.detail;
        const message = Array.isArray(detail)
          ? detail.map((item) => `${item.loc?.join(".") || "request"}: ${item.msg}`).join("; ")
          : detail;
        throw new Error(message || `Could not save hospital (${response.status}).`);
      }
      const savedHospital = responseData || {};
      await loadHospitals();
      setHospitalForm(emptyHospitalForm);
      setEditingId(null);
      setCredentials(savedHospital.credentials || null);
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error("Hospital save failed:", err);
      setError(err.message || "Could not save hospital.");
    }
  };

  const editHospital = (hospital) => {
    setEditingId(hospital.id);
    setHospitalForm({
      ...emptyHospitalForm,
      ...hospital,
      specialists: (hospital.specialists || []).join(", "),
      conditions: (hospital.conditions || []).join(", "),
      specializations: (hospital.specializations || hospital.specialists || []).join(", "),
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

        <div className="mt-8 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Stethoscope className="h-4 w-4 text-emerald-700" /> Add a doctor
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} placeholder="Doctor name" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
            <select value={doctorForm.specialization} onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })} className="rounded-md border border-stone-300 px-3 py-2 text-sm">
              {['General Physician', 'Orthopedic', 'Cardiologist', 'Pediatrician', 'Neurologist', 'Dermatologist'].map((specialization) => <option key={specialization}>{specialization}</option>)}
            </select>
            <input type="email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} placeholder="doctor@example.com" className="rounded-md border border-stone-300 px-3 py-2 text-sm" />
          </div>
          <button type="button" onClick={submitDoctor} className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"><Plus className="h-4 w-4" /> Add doctor</button>
          {doctorCredentials && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><p className="font-semibold">Doctor login created</p><p className="mt-1">Email: <span className="font-mono">{doctorCredentials.email}</span></p><p>Password: <span className="font-mono">{doctorCredentials.temporaryPassword}</span></p><p className="mt-1 break-all">Token: <span className="font-mono">{doctorCredentials.loginToken}</span></p></div>}
          <div className="mt-5 space-y-2">
            {doctors.map((doctor) => <div key={doctor.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm"><span><b>{doctor.name}</b><span className="ml-2 text-xs text-stone-500">{doctor.specialization} · {doctor.email}</span></span><span className={`rounded-full px-2 py-1 text-xs font-medium ${doctor.available ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>{doctor.available ? "Available" : "Offline"}</span></div>)}
          </div>
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
              <label className="mb-1 block text-xs font-medium text-stone-600">City</label>
              <input value={hospitalForm.city} onChange={(e) => setHospitalForm({ ...hospitalForm, city: e.target.value })} placeholder="City" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Description</label>
              <textarea value={hospitalForm.description} onChange={(e) => setHospitalForm({ ...hospitalForm, description: e.target.value })} placeholder="Verified description provided by the hospital" className="min-h-20 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Conditions treated (comma separated)</label>
              <input value={hospitalForm.conditions} onChange={(e) => setHospitalForm({ ...hospitalForm, conditions: e.target.value })} placeholder="Enter only conditions this hospital has verified" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Latitude</label>
              <input type="number" step="any" value={hospitalForm.lat} onChange={(e) => setHospitalForm({ ...hospitalForm, lat: e.target.value })} placeholder="13.8285" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Longitude</label>
              <input type="number" step="any" value={hospitalForm.lng} onChange={(e) => setHospitalForm({ ...hospitalForm, lng: e.target.value })} placeholder="77.4913" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
            </div>
            {!editingId && <>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Hospital Contact / Staff Email</label>
                <input type="email" value={hospitalForm.staffEmail} onChange={(e) => setHospitalForm({ ...hospitalForm, staffEmail: e.target.value })} placeholder="staff@hospital.com" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Default Staff Password</label>
                <input type="text" value={hospitalForm.temporaryPassword} onChange={(e) => setHospitalForm({ ...hospitalForm, temporaryPassword: e.target.value })} placeholder="Temporary password" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
              </div>
            </>}
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
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">Specializations (comma separated)</label>
              <input value={hospitalForm.specializations} onChange={(e) => setHospitalForm({ ...hospitalForm, specializations: e.target.value })} placeholder="Cardiology, Neurology" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm" />
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
          {credentials && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Hospital staff login created</p>
              <p className="mt-1">Email: <span className="font-mono">{credentials.email}</span></p>
              <p>Password: <span className="font-mono">{credentials.temporaryPassword}</span></p>
            </div>
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
