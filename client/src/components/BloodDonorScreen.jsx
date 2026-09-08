import React, { useState } from "react";
import {
  Radio,
  Users,
  UserPlus,
  Building2,
  Droplet,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import { BLOOD_GROUPS, COMPATIBLE_DONORS, DONORS, HOSPITAL_BLOOD_REQUESTS } from "../data/constants";
import { quantityStyles } from "../utils/helpers";

export default function BloodDonorScreen({ currentUser, requests, onAddRequest, onBecomeDonor, registeredDonors }) {
  const [mode, setMode] = useState("request"); // request | matches | register | hospitalRequests

  const [reqForm, setReqForm] = useState({ bloodGroup: "O+", location: "", quantity: 1, notes: "" });
  const [reqSent, setReqSent] = useState(false);

  const [regForm, setRegForm] = useState({
    name: currentUser.username,
    phone: currentUser.phone || "",
    bloodGroup: currentUser.bloodGroup || "O+",
    location: currentUser.address || "",
  });
  const [regSent, setRegSent] = useState(false);

  const [matchFilter, setMatchFilter] = useState("O+");

  const submitRequest = () => {
    if (!reqForm.location.trim()) return;
    const newReq = {
      id: "r" + Date.now(),
      bloodGroup: reqForm.bloodGroup,
      location: reqForm.location || "Location not specified",
      quantity: Number(reqForm.quantity) || 1,
      postedBy: currentUser.username,
      time: "just now",
    };
    onAddRequest(newReq);
    setReqSent(true);
    setMatchFilter(reqForm.bloodGroup);
    setTimeout(() => setReqSent(false), 3000);
    setReqForm({ bloodGroup: "O+", location: "", quantity: 1, notes: "" });
  };

  const submitRegistration = () => {
    if (!regForm.phone.trim() || !regForm.location.trim()) return;
    onBecomeDonor({
      phone: regForm.phone,
      bloodGroup: regForm.bloodGroup,
      address: regForm.location,
    });
    setRegSent(true);
    setTimeout(() => setRegSent(false), 3000);
  };

  const compatible = COMPATIBLE_DONORS[matchFilter] || [];
  const matchedDonors = [...DONORS, ...registeredDonors].filter((d) => compatible.includes(d.bloodGroup));

  const nearbyHospitalRequests = HOSPITAL_BLOOD_REQUESTS.filter((hr) =>
    (COMPATIBLE_DONORS[hr.bloodGroup] || []).includes(currentUser.bloodGroup)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900">Blood donor network</h1>
      <p className="mt-1 text-sm text-stone-600">Broadcast urgent needs, register as a donor, or find a match.</p>

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
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold sm:text-sm ${
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
                placeholder="e.g. Apollo Hospitals, Hindupur"
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
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-red-600 to-red-700 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-900/20 hover:from-red-500 hover:to-red-600"
            >
              <Radio className="h-4 w-4" /> Broadcast to nearby donors
            </button>
            {reqSent && (
              <p className="mt-2 text-center text-xs font-medium text-emerald-700">
                Request broadcast — matching donors notified.
              </p>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">Active requests nearby</h3>
            <div className="space-y-2">
              {requests.map((r) => {
                const qs = quantityStyles[r.quantity] || quantityStyles[1];
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                        {r.bloodGroup}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{r.location}</p>
                        <p className="text-xs text-stone-500">
                          {r.postedBy} · {r.time}
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
              accepts donors: {COMPATIBLE_DONORS[matchFilter].join(", ")}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {matchedDonors.length === 0 && (
              <p className="rounded-md border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
                No compatible donors found nearby right now.
              </p>
            )}
            {matchedDonors.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                    {d.bloodGroup}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-stone-800">{d.name}</p>
                    <p className="text-xs text-stone-500">
                      {d.location} · {d.distance} · last donated {d.lastDonated}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <a
                    href={`tel:${d.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${d.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                      "Hi, I found your profile on LIFE LINK. We urgently need a " + matchFilter + " blood donor — are you available?"
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded-md border border-stone-300 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Message
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                disabled
                value={regForm.name}
                className="w-full cursor-not-allowed rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
              />
              <p className="mt-1 text-xs text-stone-400">Pulled from your LIFE LINK profile.</p>
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
                placeholder="e.g. Gandhi Nagar, Hindupur"
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {currentUser.isDonor ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> You're already registered as a donor. Update your details and save
              anytime.
            </div>
          ) : null}

          <button
            type="button"
            onClick={submitRegistration}
            className="mt-4 w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
          >
            {currentUser.isDonor ? "Update donor details" : "Register as donor"}
          </button>
          {regSent && (
            <p className="mt-2 text-center text-xs font-medium text-emerald-700">
              You're now listed as an available donor. Thank you.
            </p>
          )}
        </div>
      )}

      {mode === "hospitalRequests" && (
        <div className="mt-5">
          {!currentUser.isDonor ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-stone-300" />
              <p className="mt-3 text-sm font-medium text-stone-700">Register as a donor to see hospital requests</p>
              <p className="mt-1 text-sm text-stone-500">
                Once you're a registered donor, nearby hospitals' active blood requests that match your blood group
                will show up here.
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
                Showing requests hospitals near you are broadcasting for donors compatible with your blood group (
                <span className="font-semibold text-stone-700">{currentUser.bloodGroup}</span>).
              </p>
              {nearbyHospitalRequests.length === 0 && (
                <p className="rounded-md border border-dashed border-stone-300 py-8 text-center text-sm text-stone-500">
                  No nearby hospital requests match your blood group right now.
                </p>
              )}
              {nearbyHospitalRequests.map((hr) => {
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
                        href={`tel:${hr.contact.replace(/\s/g, "")}`}
                        className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Call hospital
                      </a>
                      <a
                        href={`https://wa.me/${hr.contact.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                          `Hi, I'm a registered ${currentUser.bloodGroup} donor on LIFE LINK — I can help with your ${hr.bloodGroup} request.`
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
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

