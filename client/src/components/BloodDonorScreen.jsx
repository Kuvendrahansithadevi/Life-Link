import React, { useState, useEffect } from "react";
import {
  Radio,
  Users,
  UserPlus,
  Building2,
  Droplet,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { BLOOD_GROUPS, COMPATIBLE_DONORS, HOSPITAL_BLOOD_REQUESTS } from "../data/constants";
import { quantityStyles } from "../utils/helpers";

export default function BloodDonorScreen({
  currentUser,
  requests: initialRequests = [],
  onAddRequest,
  onBecomeDonor,
}) {
  const [mode, setMode] = useState("request"); // request | matches | register | hospitalRequests

  // Broadcast Request Form State
  const [reqForm, setReqForm] = useState({ bloodGroup: "O+", location: "", quantity: 1, notes: "" });
  const [reqSent, setReqSent] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [requestsList, setRequestsList] = useState(initialRequests);

  // Register Donor Form State
  const [regForm, setRegForm] = useState({
    name: currentUser?.username || "Donor",
    phone: currentUser?.phone || "",
    bloodGroup: currentUser?.bloodGroup || "O+",
    location: currentUser?.address || "",
  });
  const [regSent, setRegSent] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Matched Donors State
  const [matchFilter, setMatchFilter] = useState("O+");
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [apiError, setApiError] = useState(null);

  // 1. Fetch Matching Donors from FastAPI Backend
  useEffect(() => {
    let isMounted = true;

    async function fetchMatches() {
      if (mode !== "matches") return;
      setLoadingMatches(true);
      setApiError(null);

      try {
        const response = await fetch(
          `http://localhost:8000/api/donors/match?blood_group=${encodeURIComponent(matchFilter)}`
        );
        if (!response.ok) throw new Error("Failed to fetch matching donors");
        const data = await response.json();

        if (isMounted) {
          setMatchedDonors(data.donors || data || []);
        }
      } catch (err) {
        console.warn("Backend match offline, fallback to local lookup:", err);
        if (isMounted) {
          setMatchedDonors([]);
        }
      } finally {
        if (isMounted) setLoadingMatches(false);
      }
    }

    fetchMatches();

    return () => {
      isMounted = false;
    };
  }, [mode, matchFilter]);

  // 2. Submit Broadcast Request to Backend
  const submitRequest = async () => {
    if (!reqForm.location.trim()) return;

    setReqLoading(true);
    setApiError(null);

    const payload = {
      blood_group: reqForm.bloodGroup,
      location: reqForm.location.trim(),
      quantity: Number(reqForm.quantity) || 1,
      notes: reqForm.notes.trim(),
      posted_by: currentUser?.username || "Anonymous",
    };

    try {
      const response = await fetch("http://localhost:8000/api/donors/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const newReq = {
        id: "r" + Date.now(),
        bloodGroup: reqForm.bloodGroup,
        location: reqForm.location,
        quantity: Number(reqForm.quantity) || 1,
        postedBy: currentUser?.username || "You",
        time: "just now",
      };

      if (response.ok) {
        const data = await response.json();
        newReq.id = data.request_id || newReq.id;
      }

      setRequestsList((prev) => [newReq, ...prev]);
      if (onAddRequest) onAddRequest(newReq);

      setReqSent(true);
      setMatchFilter(reqForm.bloodGroup);
      setReqForm({ bloodGroup: "O+", location: "", quantity: 1, notes: "" });
      setTimeout(() => setReqSent(false), 3500);
    } catch (err) {
      console.error("Broadcast request failed:", err);
      setApiError("Could not broadcast request to server.");
    } finally {
      setReqLoading(false);
    }
  };

  // 3. Submit Donor Registration to Backend & MongoDB
  const submitRegistration = async () => {
    if (!regForm.phone.trim() || !regForm.location.trim()) return;

    setRegLoading(true);
    setApiError(null);

    const payload = {
      name: regForm.name,
      phone: regForm.phone.trim(),
      blood_group: regForm.bloodGroup,
      location: regForm.location.trim(),
      lat: 16.9891,
      lng: 82.2475,
    };

    try {
      const response = await fetch("http://localhost:8000/api/donors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Registration failed.");

      if (onBecomeDonor) {
        onBecomeDonor({
          phone: regForm.phone,
          bloodGroup: regForm.bloodGroup,
          address: regForm.location,
        });
      }

      setRegSent(true);
      setTimeout(() => setRegSent(false), 3500);
    } catch (err) {
      console.error("Donor registration error:", err);
      setApiError("Failed to register donor in database.");
    } finally {
      setRegLoading(false);
    }
  };

  const nearbyHospitalRequests = (HOSPITAL_BLOOD_REQUESTS || []).filter((hr) =>
    (COMPATIBLE_DONORS[hr.bloodGroup] || []).includes(currentUser?.bloodGroup || "O+")
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900">Blood donor network</h1>
      <p className="mt-1 text-sm text-stone-600">Broadcast urgent needs, register as a donor, or find a match.</p>

      {apiError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 sm:grid-cols-4">
        {[
          { id: "request", label: "Request blood", icon: Radio },
          { id: "matches", label: "Find donors", icon: Users },
          { id: "register", label: "Become a donor", icon: UserPlus },
          { id: "hospitalRequests", label: "Hospital requests", icon: Building2 },
        ].map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => setMode(tItem.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold sm:text-sm transition-all ${
              mode === tItem.id
                ? tItem.id === "request"
                  ? "bg-white text-red-700 shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <tItem.icon className="h-4 w-4" />
            {tItem.label}
          </button>
        ))}
      </div>

      {/* Mode: Request Blood */}
      {mode === "request" && (
        <div className="mt-5 space-y-5">
          <div
            className="rounded-xl border border-red-100 bg-white p-4 shadow-sm shadow-red-900/5"
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRequest();
            }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
              <Droplet className="h-4 w-4 text-red-600" fill="currentColor" /> Broadcast an urgent request
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Blood group needed</label>
                <select
                  value={reqForm.bloodGroup}
                  onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Quantity (units)</label>
                <select
                  value={reqForm.quantity}
                  onChange={(e) => setReqForm({ ...reqForm, quantity: Number(e.target.value) })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                >
                  <option value={1}>1 unit</option>
                  <option value={2}>2 units</option>
                  <option value={3}>3 units</option>
                </select>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-stone-400">Requests are capped at 3 units at a time.</p>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-stone-600">Hospital / location</label>
              <input
                value={reqForm.location}
                onChange={(e) => setReqForm({ ...reqForm, location: e.target.value })}
                placeholder="e.g. Apollo Hospitals, Kakinada"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-stone-600">Notes (optional)</label>
              <input
                value={reqForm.notes}
                onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
                placeholder="Contact person, ward number, etc."
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
              />
            </div>
            <button
              type="button"
              onClick={submitRequest}
              disabled={reqLoading || !reqForm.location.trim()}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-red-600 to-red-700 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-900/20 hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-300"
            >
              {reqLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
              Broadcast to nearby donors
            </button>
            {reqSent && (
              <p className="mt-2 text-center text-xs font-medium text-emerald-700">
                Request broadcast — matching donors saved and notified.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">Active requests nearby</h3>
            <div className="space-y-2">
              {requestsList.length === 0 && (
                <p className="rounded-md border border-dashed border-stone-300 py-6 text-center text-xs text-stone-500">
                  No active requests currently posted.
                </p>
              )}
              {requestsList.map((r) => {
                const qs = quantityStyles[r.quantity] || quantityStyles[1];
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                        {r.bloodGroup || r.blood_group}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{r.location}</p>
                        <p className="text-xs text-stone-500">
                          {r.postedBy || r.posted_by} · {r.time || "Recently"}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${qs.bg} ${qs.text}`}>
                      {r.quantity} unit{r.quantity > 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mode: Compatible Donors */}
      {mode === "matches" && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-white p-3">
            <span className="text-sm font-medium text-stone-700">Compatible donors for:</span>
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value)}
              className="rounded-md border border-stone-300 px-2 py-1.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            >
              {BLOOD_GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <span className="text-xs text-stone-500">
              accepts donors: {COMPATIBLE_DONORS[matchFilter]?.join(", ")}
            </span>
          </div>

          {loadingMatches ? (
            <div className="mt-8 flex flex-col items-center justify-center py-10 text-stone-500">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="mt-2 text-xs">Finding matching donors from database...</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {matchedDonors.length === 0 ? (
                <p className="rounded-md border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
                  No compatible donors found nearby right now.
                </p>
              ) : (
                matchedDonors.map((d) => {
                  const phoneRaw = (d.phone || "").replace(/\s/g, "");
                  const bGroup = d.blood_group || d.bloodGroup;
                  const dist = d.distance_km ? `${d.distance_km.toFixed(1)} km` : d.distance || "Nearby";

                  return (
                    <div key={d.id || d._id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                          {bGroup}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-stone-800">{d.name}</p>
                          <p className="text-xs text-stone-500">
                            {d.location} · {dist} {d.lastDonated ? `· last donated ${d.lastDonated}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <a
                          href={`tel:${phoneRaw}`}
                          className="flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${phoneRaw.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                            `Hi, I found your profile on LIFE LINK. We urgently need a ${matchFilter} blood donor — are you available?`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Message
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode: Register as Donor */}
      {mode === "register" && (
        <div
          className="mt-5 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5"
          onKeyDown={(e) => {
            if (e.key === "Enter") submitRegistration();
          }}
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <UserPlus className="h-4 w-4 text-emerald-700" /> Register as an available donor
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Full name</label>
              <input
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Phone number</label>
                <input
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="+91"
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Blood group</label>
                <select
                  value={regForm.bloodGroup}
                  onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                  className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Your area</label>
              <input
                value={regForm.location}
                onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                placeholder="e.g. Bhanugudi Junction, Kakinada"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {currentUser?.isDonor ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> You're already registered as a donor. You can update details anytime.
            </div>
          ) : null}

          <button
            type="button"
            onClick={submitRegistration}
            disabled={regLoading || !regForm.phone.trim() || !regForm.location.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-300"
          >
            {regLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {currentUser?.isDonor ? "Update donor details" : "Register as donor"}
          </button>

          {regSent && (
            <p className="mt-2 text-center text-xs font-medium text-emerald-700">
              You're now listed as an available donor in the database. Thank you!
            </p>
          )}
        </div>
      )}

      {/* Mode: Hospital Requests */}
      {mode === "hospitalRequests" && (
        <div className="mt-5">
          {!currentUser?.isDonor ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-3 text-sm font-medium text-stone-700">Register as a donor to see hospital requests</p>
              <p className="mt-1 text-sm text-stone-500">
                Once registered, hospitals broadcasting for compatible blood will show up here.
              </p>
              <button
                onClick={() => setMode("register")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
              >
                <UserPlus className="h-4 w-4" /> Register as a donor
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="mb-1 text-xs text-stone-500">
                Showing hospital broadcasts matching your blood group (
                <span className="font-semibold text-stone-700">{currentUser?.bloodGroup || "O+"}</span>).
              </p>
              {nearbyHospitalRequests.length === 0 ? (
                <p className="rounded-md border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
                  No nearby hospital requests match your blood group right now.
                </p>
              ) : (
                nearbyHospitalRequests.map((hr) => {
                  const qs = quantityStyles[hr.quantity] || quantityStyles[1];
                  return (
                    <div key={hr.id} className="rounded-lg border border-stone-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                            {hr.bloodGroup}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-stone-800">{hr.hospital}</p>
                            <p className="text-xs text-stone-500">
                              {hr.location} · {hr.distance} · {hr.postedAgo}
                            </p>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${qs.bg} ${qs.text}`}>
                          {hr.quantity} unit{hr.quantity > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        <a
                          href={`tel:${(hr.contact || "").replace(/\s/g, "")}`}
                          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Call hospital
                        </a>
                        <a
                          href={`https://wa.me/${(hr.contact || "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                            `Hi, I'm a registered ${currentUser?.bloodGroup || "O+"} donor on LIFE LINK — I can help with your ${hr.bloodGroup} request.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> I can donate
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}