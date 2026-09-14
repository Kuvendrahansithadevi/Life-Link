import React, { useEffect, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Droplet, Loader2, PhoneCall, Radio, UserPlus, Users } from "lucide-react";
import { BLOOD_GROUPS } from "../data/constants";
import { createBloodRequestAPI, getBloodRequestsAPI, getDonorsAPI, getHospitalBloodRequestsAPI, registerUserAsDonorAPI, updateDonorStatusAPI } from "../services/api";

const emptyRequest = { bloodGroup: "O+", units: 1, hospitalName: "", notes: "" };

function formatDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function Spinner({ label = "Loading..." }) {
  return <div className="flex items-center justify-center gap-2 py-8 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />{label}</div>;
}

function Empty({ text }) {
  return <p className="rounded-md border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">{text}</p>;
}

function RequestList({ requests, loading, title, hospital = false }) {
  if (loading) return <div><h3 className="mb-2 text-sm font-semibold text-stone-800">{title}</h3><Spinner label="Loading requests..." /></div>;
  return <div><h3 className="mb-2 text-sm font-semibold text-stone-800">{title}</h3>{requests.length ? <div className="space-y-2">{requests.map((request) => <div key={request.id} className="rounded-lg border border-stone-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">{request.bloodGroup}</span><div><p className="text-sm font-medium">{request.hospitalName}</p><p className="text-xs text-stone-500">{request.requesterName || "Hospital request"} · {formatDate(request.createdAt)} · {request.distance}</p></div></div><span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">{request.units} unit{request.units > 1 ? "s" : ""}</span></div>{request.notes && <p className="mt-2 text-xs text-stone-600">{request.notes}</p>}{hospital && request.requesterPhone && <a href={`tel:${request.requesterPhone}`} className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white"><PhoneCall className="h-3.5 w-3.5" />Call hospital</a>}</div>)}</div> : <Empty text="No requests found." />}</div>;
}

export default function BloodDonorScreen({ currentUser, onAddRequest, onBecomeDonor }) {
  const [mode, setMode] = useState("request");
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [hospitalRequests, setHospitalRequests] = useState([]);
  const [matchFilter, setMatchFilter] = useState("O+");
  const [registration, setRegistration] = useState({ bloodGroup: currentUser?.bloodGroup || "O+", phone: currentUser?.phone || "", isAvailable: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setRegistration((form) => ({ ...form, bloodGroup: currentUser?.bloodGroup || form.bloodGroup, phone: currentUser?.phone || form.phone }));
  }, [currentUser]);

  useEffect(() => {
    if (mode === "register") return undefined;
    let active = true;
    setLoading(true); setError("");
    const request = mode === "request" ? getBloodRequestsAPI() : mode === "matches" ? getDonorsAPI(matchFilter) : getHospitalBloodRequestsAPI();
    request.then((data) => { if (active) { if (mode === "request") setRequests(data); else if (mode === "matches") setDonors(data); else setHospitalRequests(data); } }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mode, matchFilter]);

  const submitRequest = async () => {
    if (!requestForm.hospitalName.trim()) return;
    setLoading(true); setError(""); setNotice("");
    try {
      await createBloodRequestAPI({ ...requestForm, hospitalName: requestForm.hospitalName.trim(), notes: requestForm.notes.trim(), requesterName: currentUser?.username || "Anonymous", requesterPhone: currentUser?.phone || "", lat: currentUser?.lat ?? null, lng: currentUser?.lng ?? null });
      const refreshed = await getBloodRequestsAPI();
      setRequests(refreshed); onAddRequest?.(refreshed[0]); setRequestForm(emptyRequest); setNotice("Request broadcast successfully.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const submitRegistration = async () => {
    if (!currentUser?.id || !registration.phone.trim()) return;
    setLoading(true); setError(""); setNotice("");
    try {
      await registerUserAsDonorAPI({ userId: currentUser.id, ...registration, phone: registration.phone.trim() });
      const updatedUser = { ...currentUser, ...registration, phone: registration.phone.trim(), isDonor: true };
      localStorage.setItem("user", JSON.stringify(updatedUser)); onBecomeDonor?.({ bloodGroup: updatedUser.bloodGroup, phone: updatedUser.phone, isAvailable: updatedUser.isAvailable }); setNotice("Your donor profile is now active.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const updateDonorStatus = async (isDonor, isAvailable) => {
    if (!currentUser?.id) return;
    setLoading(true); setError(""); setNotice("");
    try {
      await updateDonorStatusAPI({ userId: currentUser.id, isDonor, isAvailable });
      const updatedUser = { ...currentUser, isDonor, isAvailable };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onBecomeDonor?.({ isDonor, isAvailable });
      setNotice(isDonor ? (isAvailable ? "You are available to donate." : "Your donor availability is paused.") : "You are no longer listed as a donor.");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const tabs = [{ id: "request", label: "Request blood", icon: Radio }, { id: "matches", label: "Find donors", icon: Users }, { id: "register", label: "Become a donor", icon: UserPlus }, { id: "hospitalRequests", label: "Hospital requests", icon: Building2 }];
  const donorAvailable = currentUser?.isAvailable !== false;
  return <div className="mx-auto max-w-3xl px-4 py-8">
    <h1 className="text-2xl font-semibold text-stone-900">Blood donor network</h1><p className="mt-1 text-sm text-stone-600">Broadcast urgent needs, register as a donor, or find a match.</p>
    {error && <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}{notice && <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />{notice}</div>}
    <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 sm:grid-cols-4">{tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setMode(id); setError(""); }} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold sm:text-sm ${mode === id ? "bg-white text-emerald-800 shadow-sm" : "text-stone-500"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
    {mode === "request" && <section className="mt-5 space-y-5"><div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm"><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Droplet className="h-4 w-4 text-red-600" fill="currentColor" />Broadcast an urgent request</h2><div className="grid grid-cols-2 gap-3"><label className="text-xs font-medium text-stone-600">Blood group<select value={requestForm.bloodGroup} onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm">{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label><label className="text-xs font-medium text-stone-600">Units<select value={requestForm.units} onChange={(e) => setRequestForm({ ...requestForm, units: Number(e.target.value) })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"><option value={1}>1 unit</option><option value={2}>2 units</option><option value={3}>3 units</option></select></label></div><input value={requestForm.hospitalName} onChange={(e) => setRequestForm({ ...requestForm, hospitalName: e.target.value })} placeholder="Hospital name" className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /><input value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} placeholder="Notes (optional)" className="mt-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /><button onClick={submitRequest} disabled={loading || !requestForm.hospitalName.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-red-700 py-2.5 text-sm font-semibold text-white disabled:bg-stone-300">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}Broadcast to nearby donors</button></div><RequestList requests={requests} loading={loading} title="Active requests nearby" /></section>}
    {mode === "matches" && <section className="mt-5"><label className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm font-medium">Blood group<select value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)} className="rounded-md border border-stone-300 px-2 py-1.5 text-sm">{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>{loading ? <Spinner label="Finding donors..." /> : donors.length ? <div className="mt-3 space-y-2">{donors.map((donor) => <div key={donor.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">{donor.bloodGroup}</span><div><p className="text-sm font-medium">{donor.username}</p><p className="text-xs text-stone-500">{donor.address || "Location unavailable"} · {donor.distance}</p></div></div><a href={`tel:${donor.phone}`} className="flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white"><PhoneCall className="h-3.5 w-3.5" />Call</a></div>)}</div> : <Empty text="No donors match this blood group." />}</section>}
    {mode === "register" && <section className="mt-5 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"><h2 className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-emerald-700" />Become a donor</h2><p className="mt-1 text-xs text-stone-500">{currentUser?.username || "Your profile"}</p>{currentUser?.isDonor && <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active Donor</span><span className={`text-xs font-medium ${donorAvailable ? "text-emerald-700" : "text-stone-500"}`}>{donorAvailable ? "Available" : "Availability paused"}</span></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => updateDonorStatus(true, !donorAvailable)} disabled={loading} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:bg-stone-300">{donorAvailable ? "Pause availability" : "Resume availability"}</button><button onClick={() => updateDonorStatus(false, false)} disabled={loading} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60">Stop being a donor</button></div></div>}<div className="mt-4 grid grid-cols-2 gap-3"><label className="text-xs font-medium text-stone-600">Phone<input value={registration.phone} onChange={(e) => setRegistration({ ...registration, phone: e.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><label className="text-xs font-medium text-stone-600">Blood group<select value={registration.bloodGroup} onChange={(e) => setRegistration({ ...registration, bloodGroup: e.target.value })} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm">{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={registration.isAvailable} onChange={(e) => setRegistration({ ...registration, isAvailable: e.target.checked })} />Available to be contacted</label><button onClick={submitRegistration} disabled={loading || !currentUser?.id || !registration.phone.trim()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:bg-stone-300">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{currentUser?.isDonor ? "Update donor details" : "Register as donor"}</button></section>}
    {mode === "hospitalRequests" && <section className="mt-5"><RequestList requests={hospitalRequests} loading={loading} title="Hospital requests" hospital /></section>}
  </div>;
}
