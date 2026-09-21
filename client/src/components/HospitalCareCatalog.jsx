import React, { useState } from "react";
import { Plus, Save } from "lucide-react";

const emptySpecialist = { name: "", specialization: "", consultation_fee: "", day: "Monday", start_time: "09:00", end_time: "12:00" };
const emptyTreatment = { name: "", description: "", price: "", duration: "", specialization: "" };
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` });

export default function HospitalCareCatalog({ hospital, onSaved }) {
  const [specialist, setSpecialist] = useState(emptySpecialist);
  const [treatment, setTreatment] = useState(emptyTreatment);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const addSpecialist = async () => {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/hospitals/${hospital.id}/specialists`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name: specialist.name, specialization: specialist.specialization, consultation_fee: Number(specialist.consultation_fee), schedule: [{ day: specialist.day, start_time: specialist.start_time, end_time: specialist.end_time }] }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || "Could not add specialist.");
      onSaved({ ...hospital, specialist_profiles: [...(hospital.specialist_profiles || []), data] }); setSpecialist(emptySpecialist); setMessage("Specialist schedule saved.");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const addTreatment = async () => {
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/hospitals/${hospital.id}/treatments`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ ...treatment, price: Number(treatment.price) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.detail || "Could not add treatment.");
      onSaved({ ...hospital, treatments: [...(hospital.treatments || []), data] }); setTreatment(emptyTreatment); setMessage("Treatment saved.");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  return <section className="mt-5 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Care catalog and schedules</h2><p className="mt-1 text-xs text-stone-500">Only your linked hospital account can add these records.</p>{error && <p className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}{message && <p className="mt-3 rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{message}</p>}<div className="mt-4 grid gap-5 lg:grid-cols-2"><div><p className="text-xs font-semibold text-stone-700">Add specialist schedule</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{[["name", "Doctor name"], ["specialization", "Specialization"], ["consultation_fee", "Fee"]].map(([key, label]) => <input key={key} value={specialist[key]} onChange={(event) => setSpecialist({ ...specialist, [key]: event.target.value })} placeholder={label} className="rounded-md border border-stone-300 px-3 py-2 text-sm" />)}<select value={specialist.day} onChange={(event) => setSpecialist({ ...specialist, day: event.target.value })} className="rounded-md border border-stone-300 px-3 py-2 text-sm">{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => <option key={day}>{day}</option>)}</select><input type="time" value={specialist.start_time} onChange={(event) => setSpecialist({ ...specialist, start_time: event.target.value })} className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><input type="time" value={specialist.end_time} onChange={(event) => setSpecialist({ ...specialist, end_time: event.target.value })} className="rounded-md border border-stone-300 px-3 py-2 text-sm" /></div><button onClick={addSpecialist} disabled={saving || !specialist.name || !specialist.specialization} className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:bg-stone-300"><Plus className="h-3.5 w-3.5" />Save specialist</button></div><div><p className="text-xs font-semibold text-stone-700">Add treatment</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><input value={treatment.name} onChange={(event) => setTreatment({ ...treatment, name: event.target.value })} placeholder="Treatment name" className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><input type="number" min="0" value={treatment.price} onChange={(event) => setTreatment({ ...treatment, price: event.target.value })} placeholder="Starting price" className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><input value={treatment.specialization} onChange={(event) => setTreatment({ ...treatment, specialization: event.target.value })} placeholder="Relevant specialty" className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><input value={treatment.duration} onChange={(event) => setTreatment({ ...treatment, duration: event.target.value })} placeholder="Duration" className="rounded-md border border-stone-300 px-3 py-2 text-sm" /><textarea value={treatment.description} onChange={(event) => setTreatment({ ...treatment, description: event.target.value })} placeholder="Short description" className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:col-span-2" rows="2" /></div><button onClick={addTreatment} disabled={saving || !treatment.name} className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:bg-stone-300"><Save className="h-3.5 w-3.5" />Save treatment</button></div></div></section>;
}
