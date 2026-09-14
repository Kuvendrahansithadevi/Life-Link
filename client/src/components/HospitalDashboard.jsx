import React, { useEffect, useState } from "react";
import { Activity, Building2, CheckCircle2, Loader2, LogOut } from "lucide-react";

const emptyUpdates = { available_beds: 0, available_icu_beds: 0, doctor_status: "Available", available_now: true };

export default function HospitalDashboard({ currentUser, onLogout }) {
  const [hospital, setHospital] = useState(null);
  const [updates, setUpdates] = useState(emptyUpdates);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadHospital() {
      if (!currentUser?.hospitalId) {
        setError("This staff account is not linked to a hospital.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/hospitals/${currentUser.hospitalId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Could not load hospital.");
        if (active) {
          setHospital(data);
          setUpdates({
            available_beds: data.available_beds ?? 0,
            available_icu_beds: data.available_icu_beds ?? data.icu_beds ?? 0,
            doctor_status: data.doctor_status || "Available",
            available_now: data.available_now ?? true,
          });
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHospital();
    return () => { active = false; };
  }, [currentUser?.hospitalId]);

  const saveUpdates = async () => {
    if (!currentUser?.hospitalId) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/hospitals/${currentUser.hospitalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not update hospital.");
      setHospital(data);
      setMessage("Hospital status updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return <div className="min-h-screen bg-stone-50 text-stone-900">
    <header className="border-b border-stone-200 bg-white px-6 py-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><Building2 className="h-5 w-5" /></span><div><p className="text-sm font-bold">LIFE LINK Hospital Portal</p><p className="text-xs text-stone-500">{hospital?.name || "Hospital staff"}</p></div></div>
        <button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium text-stone-700"><LogOut className="h-3.5 w-3.5" />Log out</button>
      </div>
    </header>
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-xl font-semibold">Hospital operations</h1><p className="mt-1 text-sm text-stone-600">Keep your hospital availability current for patients and staff.</p>
      {loading && <div className="flex items-center gap-2 py-10 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Loading hospital data...</div>}
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!loading && hospital && <><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Total beds</p><p className="mt-1 text-2xl font-bold">{hospital.total_beds}</p></div><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">ICU beds</p><p className="mt-1 text-2xl font-bold">{hospital.icu_beds}</p></div><div className="rounded-xl border border-stone-200 bg-white p-4"><p className="text-xs text-stone-500">Location</p><p className="mt-1 text-sm font-medium">{hospital.address}</p></div></div><section className="mt-6 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-emerald-700" />Update live availability</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-xs font-medium text-stone-600">Available beds<input type="number" min="0" value={updates.available_beds} onChange={(e) => setUpdates({ ...updates, available_beds: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-stone-600">Available ICU beds<input type="number" min="0" value={updates.available_icu_beds} onChange={(e) => setUpdates({ ...updates, available_icu_beds: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-stone-600">Doctor status<select value={updates.doctor_status} onChange={(e) => setUpdates({ ...updates, doctor_status: e.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"><option>Available</option><option>Limited</option><option>Unavailable</option></select></label><label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={updates.available_now} onChange={(e) => setUpdates({ ...updates, available_now: e.target.checked })} />Accepting patients now</label></div><button onClick={saveUpdates} disabled={saving} className="mt-5 flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:bg-stone-300">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Save updates</button>{message && <p className="mt-3 text-xs font-medium text-emerald-700">{message}</p>}</section></>}
    </main>
  </div>;
}
