import React from "react";
import {
  LayoutDashboard,
  LogOut,
  Users,
  Droplet,
  ClipboardList,
  Building2,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { HOSPITALS, HOSPITAL_BLOOD_REQUESTS } from "../data/constants";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="h-4 w-4 text-white" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function AdminDashboard({ users, requests, onRemoveRequest, onLogout }) {
  const donors = users.filter((u) => u.isDonor);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-white/10 bg-slate-900/60 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-tight">LIFE LINK Admin</p>
              <p className="text-xs text-slate-400">Network overview & moderation</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Users} label="Registered users" value={users.length} accent="bg-emerald-600" />
          <StatCard icon={Droplet} label="Registered donors" value={donors.length} accent="bg-red-600" />
          <StatCard icon={ClipboardList} label="Active blood requests" value={requests.length} accent="bg-amber-600" />
          <StatCard icon={Building2} label="Partner hospitals" value={HOSPITALS.length} accent="bg-sky-600" />
        </div>

        {/* Registered users */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold">Registered users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Username</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                  <th className="px-4 py-2.5 font-medium">Address</th>
                  <th className="px-4 py-2.5 font-medium">Blood group</th>
                  <th className="px-4 py-2.5 font-medium">Donor status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-white">{u.username}</td>
                    <td className="px-4 py-2.5 text-slate-300">{u.email}</td>
                    <td className="px-4 py-2.5 text-slate-300">{u.address}</td>
                    <td className="px-4 py-2.5 text-slate-300">{u.bloodGroup}</td>
                    <td className="px-4 py-2.5">
                      {u.isDonor ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Donor
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-white/5 px-2 py-1 text-xs font-medium text-slate-400">
                          Not a donor
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active blood requests */}
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Droplet className="h-4 w-4 text-red-400" fill="currentColor" />
            <h2 className="text-sm font-semibold">Community blood requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Blood group</th>
                  <th className="px-4 py-2.5 font-medium">Quantity</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Posted by</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                      No active requests right now.
                    </td>
                  </tr>
                )}
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-white">{r.bloodGroup}</td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {r.quantity} unit{r.quantity > 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{r.location}</td>
                    <td className="px-4 py-2.5 text-slate-300">{r.postedBy}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.time}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => onRemoveRequest(r.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hospital feed */}
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-slate-900">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Building2 className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold">Hospital blood request feed</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-2.5 font-medium">Hospital</th>
                  <th className="px-4 py-2.5 font-medium">Blood group</th>
                  <th className="px-4 py-2.5 font-medium">Quantity</th>
                  <th className="px-4 py-2.5 font-medium">Distance</th>
                  <th className="px-4 py-2.5 font-medium">Posted</th>
                </tr>
              </thead>
              <tbody>
                {HOSPITAL_BLOOD_REQUESTS.map((hr) => (
                  <tr key={hr.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-white">{hr.hospital}</td>
                    <td className="px-4 py-2.5 text-slate-300">{hr.bloodGroup}</td>
                    <td className="px-4 py-2.5 text-slate-300">
                      {hr.quantity} unit{hr.quantity > 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{hr.distance}</td>
                    <td className="px-4 py-2.5 text-slate-400">{hr.postedAgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

