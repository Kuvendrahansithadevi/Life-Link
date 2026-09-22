import React, { useEffect, useState } from "react";
import { Activity, Building2, CheckCircle2, Droplet, Loader2, LogOut, Minus, Plus } from "lucide-react";
import { BLOOD_GROUPS } from "../data/constants";
import HospitalCareCatalog from "../components/HospitalCareCatalog";

const initialBloodForm = { bloodGroup: "O+", units: 1, notes: "" };

function apiError(data, fallback) {
  return data?.detail || fallback;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function HospitalDashboardScreen({ currentUser, onLogout }) {
  const hospitalId = currentUser?.hospitalId;
  const [hospital, setHospital] = useState(null);
  const [beds, setBeds] = useState({ availableBeds: 0, icuBeds: 0, waitTime: "15 min" });
  const [bloodForm, setBloodForm] = useState(initialBloodForm);
  const [queue, setQueue] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingAction, setBookingAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = async () => {
    if (!hospitalId) {
      setError("This staff account is not linked to a hospital.");
      setLoading(false);
      return;
    }
    setLoading(true); setError("");
    try {
      const [hospitalResponse, queueResponse, bookingsResponse] = await Promise.all([
        fetch(`/api/hospitals/my-hospital?hospital_id=${encodeURIComponent(hospitalId)}`, { headers: authHeaders() }),
        fetch(`/api/hospitals/my-hospital/queue?hospital_id=${encodeURIComponent(hospitalId)}`, { headers: authHeaders() }),
        fetch(`/api/hospitals/${encodeURIComponent(hospitalId)}/bookings`, { headers: authHeaders() }),
      ]);
      const hospitalData = await hospitalResponse.json();
      const queueData = await queueResponse.json();
      const bookingsData = await bookingsResponse.json();
      if (!hospitalResponse.ok) throw new Error(apiError(hospitalData, "Could not load hospital."));
      if (!queueResponse.ok) throw new Error(apiError(queueData, "Could not load incoming requests."));
      if (!bookingsResponse.ok) throw new Error(apiError(bookingsData, "Could not load incoming appointments."));
      setHospital(hospitalData);
      setBeds({ availableBeds: hospitalData.available_beds ?? 0, icuBeds: hospitalData.available_icu_beds ?? hospitalData.icu_beds ?? 0, waitTime: hospitalData.wait_time || "15 min" });
      setQueue(Array.isArray(queueData) ? queueData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [hospitalId]);

  const changeBed = (field, amount) => setBeds((current) => ({ ...current, [field]: Math.max(0, Number(current[field]) + amount) }));

  const saveBeds = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/hospitals/${hospitalId}/beds`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(beds) });
      const data = await response.json();
      if (!response.ok) throw new Error(apiError(data, "Could not save bed status."));
      setHospital(data); setNotice("Availability saved.");
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  const toggleSpecialist = async (specialist) => {
    const current = hospital?.specialist_availability?.[specialist] ?? true;
    setError("");
    try {
      const response = await fetch(`/api/hospitals/${hospitalId}/specialists`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ specialist, onDuty: !current }) });
      const data = await response.json();
      if (!response.ok) throw new Error(apiError(data, "Could not update specialist status."));
      setHospital(data);
    } catch (err) { setError(err.message); }
  };

  const broadcastBloodRequest = async () => {
    setBroadcasting(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/hospitals/my-hospital/blood-request?hospital_id=${encodeURIComponent(hospitalId)}`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ ...bloodForm, requesterName: hospital?.name || currentUser?.username || "Hospital", requesterPhone: hospital?.phone || "" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(apiError(data, "Could not broadcast blood request."));
      setBloodForm(initialBloodForm); setNotice("Verified blood request broadcast.");
    } catch (err) { setError(err.message); } finally { setBroadcasting(false); }
  };

  const updateBookingStatus = async (bookingId, status) => {
    setBookingAction(`${bookingId}:${status}`); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/hospitals/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(apiError(data, "Could not update appointment status."));
      setBookings((items) => items.map((item) => item.id === bookingId ? { ...item, status } : item));
      setNotice(`Appointment marked ${status.toLowerCase()}.`);
    } catch (err) { setError(err.message); } finally { setBookingAction(""); }
  };

  return <div className="min-h-screen bg-stone-50 text-stone-900"><header className="border-b border-stone-200 bg-white px-6 py-4"><div className="mx-auto flex max-w-5xl items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white"><Building2 className="h-5 w-5" /></span><div><p className="text-sm font-bold">LIFE LINK Hospital Portal</p><p className="text-xs text-stone-500">{hospital?.name || currentUser?.username || "Hospital staff"}</p></div></div><button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium"><LogOut className="h-3.5 w-3.5" />Log out</button></div></header>
    <main className="mx-auto max-w-5xl px-6 py-8"><h1 className="text-xl font-semibold">Hospital operations</h1><p className="mt-1 text-sm text-stone-600">Manage live capacity, emergency specialists, and incoming requests.</p>{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</p>}{loading ? <div className="flex items-center gap-2 py-12 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Loading dashboard...</div> : hospital && <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><section className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold"><Activity className="h-4 w-4 text-emerald-700" />Bed availability</h2><div className="mt-4 grid grid-cols-2 gap-3"><BedControl label="General beds" value={beds.availableBeds} onChange={(amount) => changeBed("availableBeds", amount)} /><BedControl label="Available ICU beds" value={beds.icuBeds} onChange={(amount) => changeBed("icuBeds", amount)} /></div><label className="mt-4 block text-xs font-medium text-stone-600">Typical wait time<input value={beds.waitTime} onChange={(e) => setBeds({ ...beds, waitTime: e.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><button onClick={saveBeds} disabled={saving} className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-stone-300">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Save Status</button></section>
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Specialists On-Duty</h2><div className="mt-3 space-y-2">{(hospital.specialists || []).map((specialist) => { const onDuty = hospital.specialist_availability?.[specialist] ?? true; return <div key={specialist} className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2.5"><span className="text-sm">{specialist}</span><button onClick={() => toggleSpecialist(specialist)} aria-label={`${specialist} ${onDuty ? "on duty" : "off duty"}`} className={`relative h-6 w-11 rounded-full transition-colors ${onDuty ? "bg-emerald-600" : "bg-stone-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${onDuty ? "left-6" : "left-1"}`} /></button></div>; })}</div></section>
      <section className="rounded-xl border border-red-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold"><Droplet className="h-4 w-4 text-red-600" fill="currentColor" />Urgent blood broadcast</h2><div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-medium text-stone-600">Blood group<select value={bloodForm.bloodGroup} onChange={(e) => setBloodForm({ ...bloodForm, bloodGroup: e.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm">{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label><label className="text-xs font-medium text-stone-600">Units<select value={bloodForm.units} onChange={(e) => setBloodForm({ ...bloodForm, units: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label></div><input value={bloodForm.notes} onChange={(e) => setBloodForm({ ...bloodForm, notes: e.target.value })} placeholder="Ward, patient, or contact details" className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /><button onClick={broadcastBloodRequest} disabled={broadcasting} className="mt-4 flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-stone-300">{broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" />}Broadcast verified request</button></section>
      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm lg:col-span-2"><h2 className="text-sm font-semibold">Incoming Appointments &amp; Triage Queue</h2><p className="mt-1 text-xs text-stone-500">Live bookings for {hospital.name}.</p>{bookings.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} action={bookingAction} onStatusChange={updateBookingStatus} />)}</div> : <p className="mt-4 rounded-md border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">No incoming appointments for this hospital.</p>}{queue.length > 0 && <p className="mt-4 text-xs text-stone-500">Additional triage requests received: {queue.filter((item) => item.type === "triage").length}</p>}</section></div>} {hospital && <HospitalCareCatalog hospital={hospital} onSaved={setHospital} />}</main></div>;
}

    function BookingCard({ booking, action, onStatusChange }) {
      const status = booking.status || "Confirmed";
      const busy = action.startsWith(`${booking.id}:`);
      const statusClass = status === "Completed" ? "bg-stone-100 text-stone-600" : ["Cancelled", "cancelled"].includes(status) ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700";
      return <article className="rounded-lg border border-stone-100 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-stone-900">{booking.patientName || "Unnamed patient"}</p><p className="mt-1 text-xs text-stone-500">{booking.appointmentType === "treatment" ? `Treatment: ${booking.treatment}` : `Specialist: ${booking.specialist}`}</p></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>{status}</span></div><div className="mt-3 grid gap-1 text-xs text-stone-600">{booking.appointmentDate && <p><span className="font-medium">Date:</span> {booking.appointmentDate}</p>}{booking.appointmentTime && <p><span className="font-medium">Time:</span> {booking.appointmentTime}</p>}<p><span className="font-medium">Payment:</span> {booking.paymentStatus || "PENDING"}</p>{booking.notes && <p><span className="font-medium">Notes:</span> {booking.notes}</p>}</div><div className="mt-3 flex flex-wrap gap-2">{booking.patientPhone && <a href={`tel:${booking.patientPhone}`} className="rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700">Call patient</a>}{(status === "Confirmed" || status === "paid") && <><button onClick={() => onStatusChange(booking.id, "Completed")} disabled={busy} className="rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white disabled:bg-stone-300">Mark completed</button><button onClick={() => onStatusChange(booking.id, "Cancelled")} disabled={busy} className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60">Cancel</button></>}</div></article>;
    }

function BedControl({ label, value, onChange }) {
  return <div className="rounded-lg border border-stone-200 p-3"><p className="text-xs font-medium text-stone-600">{label}</p><div className="mt-2 flex items-center justify-between"><button onClick={() => onChange(-1)} aria-label={`Decrease ${label}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-stone-300"><Minus className="h-4 w-4" /></button><span className="text-2xl font-bold">{value}</span><button onClick={() => onChange(1)} aria-label={`Increase ${label}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-white"><Plus className="h-4 w-4" /></button></div></div>;
}
