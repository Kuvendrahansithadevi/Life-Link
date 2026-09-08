import React, { useState, useEffect, useRef } from "react";
import {
  ImagePlus,
  Droplet,
  CheckCircle2,
} from "lucide-react";
import { BLOOD_GROUPS } from "../data/constants";
import { initialsOf } from "../utils/helpers";

export default function ProfileScreen({ currentUser, onUpdateUser }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(currentUser);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setForm(currentUser);
  }, [currentUser]);

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...form, profileImage: reader.result };
      setForm(updated);
      onUpdateUser({ profileImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const startEdit = () => {
    setForm(currentUser);
    setEditing(true);
  };

  const save = () => {
    onUpdateUser({
      email: form.email,
      phone: form.phone,
      address: form.address,
      bloodGroup: form.bloodGroup,
    });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-900">Your profile</h1>
      <p className="mt-1 text-sm text-stone-600">Manage your details, contact info, and donor status.</p>

      <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={currentUser.username}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-emerald-100"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-800 ring-2 ring-emerald-100">
                {initialsOf(currentUser.username)}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md hover:bg-emerald-800"
              title="Change profile photo"
            >
              <ImagePlus className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-stone-900">{currentUser.username}</p>
            <p className="truncate text-sm text-stone-500">{currentUser.email}</p>
            {currentUser.isDonor && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <Droplet className="h-3 w-3" fill="currentColor" /> Registered blood donor · {currentUser.bloodGroup}
              </span>
            )}
          </div>
        </div>

        <div
          className="mt-6 space-y-4 border-t border-stone-100 pt-5"
          onKeyDown={(e) => {
            if (e.key === "Enter" && editing) save();
          }}
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Username</label>
            <input
              disabled
              value={currentUser.username}
              className="w-full cursor-not-allowed rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Email address</label>
            <input
              disabled={!editing}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
                editing
                  ? "border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-500"
              }`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Phone number</label>
              <input
                disabled={!editing}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91"
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
                  editing
                    ? "border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-500"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Blood group</label>
              <select
                disabled={!editing}
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
                  editing
                    ? "border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-500"
                }`}
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Address</label>
            <textarea
              disabled={!editing}
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`w-full resize-none rounded-md border px-3 py-2 text-sm outline-none ${
                editing
                  ? "border-stone-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  : "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-500"
              }`}
            />
          </div>

          {saved && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Profile updated.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={save}
                  className="flex-1 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(currentUser);
                    setEditing(false);
                  }}
                  className="flex-1 rounded-lg border border-stone-300 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEdit}
                className="w-full rounded-lg border border-emerald-200 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Edit details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

