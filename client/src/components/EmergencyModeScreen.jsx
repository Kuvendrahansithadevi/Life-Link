import React, { useEffect, useRef, useState } from "react";
import {
  Siren,
  ArrowLeft,
  Phone,
  ChevronRight,
  MapPinned,
  Navigation,
  MessageCircle,
  Send,
  ShieldAlert,
  CheckCircle2,
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { TRAUMA_CENTER } from "../data/constants";
import {
  getEmergencyContactsAPI,
  addEmergencyContactAPI,
  updateEmergencyContactAPI,
  deleteEmergencyContactAPI,
  triggerEmergencyAlertAPI,
} from "../services/api";

const EMPTY_FORM = { name: "", phone: "", relation: "" };

export default function EmergencyModeScreen({ onExit, t, currentUser, triageResult }) {
  const [coords, setCoords] = useState({ lat: TRAUMA_CENTER.lat, lng: TRAUMA_CENTER.lng, source: "estimated" });
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [message, setMessage] = useState(
    "EMERGENCY — I need urgent medical help. This is my live location, please come or send help immediately: "
  );

  // Add-contact modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [savingEditId, setSavingEditId] = useState(null);

  // Per-row delete state
  const [deletingId, setDeletingId] = useState(null);

  // Emergency alert logging (fired once per Emergency Mode activation)
  const alertLoggedRef = useRef(false);
  const [alertStatus, setAlertStatus] = useState("idle"); // idle | logging | logged | error

  const hasUser = Boolean(currentUser?.id);

  const loadContacts = async () => {
    if (!hasUser) {
      setContactsLoading(false);
      setContactsError("You need to be logged in to view emergency contacts.");
      return;
    }
    setContactsLoading(true);
    setContactsError("");
    try {
      const data = await getEmergencyContactsAPI();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading emergency contacts:", error);
      setContactsError("Couldn't load your emergency contacts. Check your connection and try again.");
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "live",
          });
        },
        () => {
          console.log("Location permission denied. Using estimated location.");
        },
        { timeout: 4000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Log a single emergency alert event on the backend when Emergency Mode
  // is activated for this user. Guarded so it only fires once per mount,
  // even under React StrictMode's double-invoke in development.
  useEffect(() => {
    if (!hasUser || alertLoggedRef.current) return;
    alertLoggedRef.current = true;

    const logAlert = async () => {
      setAlertStatus("logging");
      try {
        await triggerEmergencyAlertAPI(coords.lat, coords.lng, message);
        setAlertStatus("logged");
      } catch (error) {
        console.error("Error logging emergency alert:", error);
        setAlertStatus("error");
      }
    };

    logAlert();
    // Intentionally run only once when the screen mounts with a user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser]);

  const locationLink = `https://maps.google.com/?q=${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
  const fullMessage = `${message}${locationLink}`;

  // ---- Add contact ----
  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (savingContact) return;
    setShowAddModal(false);
  };

  const submitAddContact = async () => {
    const name = form.name.trim();
    const phone = form.phone.trim();
    const relation = form.relation.trim();

    if (!name || !phone || !relation) {
      setFormError("Please fill in name, phone, and relation.");
      return;
    }

    setSavingContact(true);
    setFormError("");
    try {
      await addEmergencyContactAPI({ name, phone, relation });
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      await loadContacts();
    } catch (error) {
      console.error("Error adding emergency contact:", error);
      setFormError(error.message || "Failed to add contact. Please try again.");
    } finally {
      setSavingContact(false);
    }
  };

  // ---- Edit contact ----
  const startEdit = (contact) => {
    setEditingId(contact.id);
    setEditForm({ name: contact.name, phone: contact.phone, relation: contact.relation });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  };

  const submitEdit = async (contactId) => {
    const name = editForm.name.trim();
    const phone = editForm.phone.trim();
    const relation = editForm.relation.trim();

    if (!name || !phone || !relation) return;

    setSavingEditId(contactId);
    try {
      await updateEmergencyContactAPI(contactId, { name, phone, relation });
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      await loadContacts();
    } catch (error) {
      console.error("Error updating emergency contact:", error);
    } finally {
      setSavingEditId(null);
    }
  };

  // ---- Delete contact ----
  const deleteContact = async (contactId) => {
    setDeletingId(contactId);
    try {
      await deleteEmergencyContactAPI(contactId);
      setContacts((cs) => cs.filter((c) => c.id !== contactId));
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
    } finally {
      setDeletingId(null);
    }
  };

  // ---- Notify ----
  // NOTE: browsers cannot silently send SMS. This opens the device's SMS
  // composer pre-filled with the message + live location link; the person
  // still has to hit send in their own SMS app. If a real SMS provider
  // (Twilio, etc.) is wired up later on the backend, this is the single
  // place to swap the client-side "sms:" link for a POST to that provider.
  const buildSmsUri = (phone) => `sms:${phone}?body=${encodeURIComponent(fullMessage)}`;

  const notifyOne = (id) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    window.open(buildSmsUri(contact.phone), "_blank");

    setContacts((cs) => cs.map((c) => (c.id === id ? { ...c, uiStatus: "opened" } : c)));
  };

  const notifyAll = () => {
    if (contacts.length === 0 || broadcasting) return;
    setBroadcasting(true);

    // Browsers block rapid-fire navigation/popups, so we stagger the SMS
    // composer opens slightly. Each one still needs the user to confirm
    // send inside their own SMS app — this does not send SMS on its own.
    contacts.forEach((contact, index) => {
      setTimeout(() => {
        window.open(buildSmsUri(contact.phone), "_blank");
        setContacts((cs) => cs.map((c) => (c.id === contact.id ? { ...c, uiStatus: "opened" } : c)));
        if (index === contacts.length - 1) setBroadcasting(false);
      }, index * 400);
    });
  };

  return (
    <div className="min-h-screen bg-red-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Siren className="h-6 w-6 text-red-400" />
            <span className="text-lg font-bold tracking-tight">Emergency Mode</span>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-md border border-red-400/40 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.exitEmergency}
          </button>
        </div>

        {triageResult && (
          <section className="mt-5 rounded-xl border border-red-400/30 bg-white p-4 text-stone-900 shadow-lg" aria-labelledby="emergency-status-heading">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-700">Emergency status</p>
                <h1 id="emergency-status-heading" className="mt-1 text-xl font-bold">Emergency Mode</h1>
                <p className="mt-1 text-sm font-semibold text-red-700">{triageResult.urgency || "Urgent"} urgency</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {triageResult.guidance || "Your symptoms may require immediate medical attention."}
                </p>
                {triageResult.specialist && (
                  <p className="mt-2 text-xs text-stone-500">Recommended specialist: <span className="font-semibold text-stone-700">{triageResult.specialist}</span></p>
                )}
              </div>
            </div>
            {triageResult.suggested_hospitals?.length > 0 && (
              <div className="mt-4 border-t border-stone-100 pt-3">
                <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Nearby hospitals from triage</p>
                <div className="mt-2 space-y-2">
                  {triageResult.suggested_hospitals.map((hospital) => (
                    <div key={hospital.id} className="flex items-center justify-between gap-3 rounded-lg bg-stone-50 px-3 py-2 text-xs">
                      <span className="min-w-0 truncate font-semibold text-stone-700">{hospital.name}</span>
                      <span className="shrink-0 text-stone-500">{hospital.distance}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Call ambulance */}
        <a
          href="tel:108"
          className="mt-5 flex items-center justify-between rounded-xl border-2 border-red-400 bg-red-600 px-5 py-5 shadow-lg shadow-red-900/50"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <Phone className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-red-100">Tap to call now</p>
              <p className="text-2xl font-bold">Ambulance · 108</p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </a>

        {/* Trauma center */}
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-900/50 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-300">
            <MapPinned className="h-3.5 w-3.5" /> Nearest trauma center
          </p>
          <p className="mt-1.5 font-semibold text-white">{TRAUMA_CENTER.name}</p>
          <p className="mt-0.5 text-sm text-red-200">
            {TRAUMA_CENTER.distance} away · ETA {TRAUMA_CENTER.eta}
          </p>
          <p className="mt-1 text-xs text-red-300">
            Your location ({coords.source}): {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </p>
          {alertStatus === "logged" && (
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Emergency alert logged
            </p>
          )}
          {alertStatus === "error" && (
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5" /> Couldn't log the alert to the server — 108 still works.
            </p>
          )}
          <a
            href={`https://maps.google.com/?daddr=${TRAUMA_CENTER.lat},${TRAUMA_CENTER.lng}&saddr=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50"
          >
            <Navigation className="h-4 w-4" /> Get directions
          </a>
        </div>

        {/* Broadcast */}
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-900/50 p-4">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-300">
            <MessageCircle className="h-3.5 w-3.5" /> Broadcast emergency message
          </p>
          <textarea
            value={fullMessage}
            onChange={(e) => setMessage(e.target.value.replace(locationLink, ""))}
            rows={3}
            className="mt-2 w-full resize-none rounded-md border border-red-400/40 bg-red-950/60 p-2.5 text-sm text-red-50 outline-none focus:border-red-300"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(fullMessage)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={`sms:?body=${encodeURIComponent(fullMessage)}`}
              className="flex items-center justify-center gap-1.5 rounded-md bg-white py-2.5 text-sm font-semibold text-red-800 hover:bg-red-50"
            >
              <Send className="h-4 w-4" /> SMS
            </a>
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="mt-4 rounded-xl border border-red-400/30 bg-red-900/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-300">
              <ShieldAlert className="h-3.5 w-3.5" /> Emergency contacts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={openAddModal}
                className="flex items-center gap-1 rounded-md border border-red-400/40 px-2.5 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-900"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
              <button
                onClick={notifyAll}
                disabled={broadcasting || contacts.length === 0}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
              >
                {broadcasting ? "Notifying…" : "Notify all"}
              </button>
            </div>
          </div>

          <p className="mt-2 text-[11px] leading-snug text-red-300/80">
            Notify opens your phone's SMS app pre-filled with your message and live location — you still confirm
            send. LIFE LINK cannot send SMS silently from the browser.
          </p>

          <div className="mt-3 space-y-2">
            {contactsLoading && (
              <div className="flex items-center gap-2 rounded-md bg-red-950/50 px-3 py-3 text-sm text-red-200">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your emergency contacts…
              </div>
            )}

            {!contactsLoading && contactsError && (
              <div className="rounded-md bg-red-950/50 px-3 py-3 text-sm text-amber-300">
                {contactsError}
                <button onClick={loadContacts} className="ml-2 underline hover:text-amber-200">
                  Retry
                </button>
              </div>
            )}

            {!contactsLoading && !contactsError && contacts.length === 0 && (
              <p className="rounded-md bg-red-950/50 px-3 py-3 text-sm text-red-300">
                No emergency contacts added yet.
              </p>
            )}

            {!contactsLoading &&
              !contactsError &&
              contacts.map((c) =>
                editingId === c.id ? (
                  <div key={c.id} className="space-y-2 rounded-md bg-red-950/50 px-3 py-2.5">
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Name"
                      className="w-full rounded-md border border-red-400/40 bg-red-950/60 px-2 py-1.5 text-sm text-red-50 outline-none focus:border-red-300"
                    />
                    <input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone"
                      className="w-full rounded-md border border-red-400/40 bg-red-950/60 px-2 py-1.5 text-sm text-red-50 outline-none focus:border-red-300"
                    />
                    <input
                      value={editForm.relation}
                      onChange={(e) => setEditForm({ ...editForm, relation: e.target.value })}
                      placeholder="Relation"
                      className="w-full rounded-md border border-red-400/40 bg-red-950/60 px-2 py-1.5 text-sm text-red-50 outline-none focus:border-red-300"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={cancelEdit}
                        className="rounded-md border border-red-400/40 px-2.5 py-1 text-xs text-red-100 hover:bg-red-900"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => submitEdit(c.id)}
                        disabled={savingEditId === c.id}
                        className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
                      >
                        {savingEditId === c.id ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={c.id} className="flex items-center justify-between rounded-md bg-red-950/50 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-red-50">{c.name}</p>
                      <p className="truncate text-xs text-red-300">{c.phone}</p>
                      {c.relation && <p className="truncate text-[11px] text-red-400">{c.relation}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {c.uiStatus === "opened" ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> SMS opened
                        </span>
                      ) : (
                        <button
                          onClick={() => notifyOne(c.id)}
                          className="rounded-md border border-red-400/40 px-2.5 py-1 text-xs text-red-100 hover:bg-red-900"
                        >
                          Notify
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(c)}
                        title="Edit contact"
                        aria-label="Edit contact"
                        className="rounded-md border border-red-400/40 p-1.5 text-red-100 hover:bg-red-900"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteContact(c.id)}
                        disabled={deletingId === c.id}
                        title="Delete contact"
                        aria-label="Delete contact"
                        className="rounded-md border border-red-400/40 p-1.5 text-red-100 hover:bg-red-900 disabled:opacity-60"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-red-300/80">
          LIFE LINK Emergency Mode surfaces the fastest paths to help. It does not dispatch emergency services on
          its own — calling 108 is the fastest way to get an ambulance moving.
        </p>
      </div>

      {/* Add Contact modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl border border-red-400/30 bg-red-950 p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Add Emergency Contact</h2>
              <button onClick={closeAddModal} className="text-red-300 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-red-300">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-red-400/40 bg-red-900/40 px-3 py-2 text-sm text-red-50 outline-none focus:border-red-300"
                  placeholder="e.g. Anitha"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-red-300">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-md border border-red-400/40 bg-red-900/40 px-3 py-2 text-sm text-red-50 outline-none focus:border-red-300"
                  placeholder="e.g. +919876543210"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-red-300">Relation</label>
                <input
                  value={form.relation}
                  onChange={(e) => setForm({ ...form, relation: e.target.value })}
                  className="w-full rounded-md border border-red-400/40 bg-red-900/40 px-3 py-2 text-sm text-red-50 outline-none focus:border-red-300"
                  placeholder="e.g. Mother"
                />
              </div>

              {formError && <p className="text-xs font-medium text-amber-300">{formError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={closeAddModal}
                  disabled={savingContact}
                  className="rounded-md border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-900 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAddContact}
                  disabled={savingContact}
                  className="flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-60"
                >
                  {savingContact && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Add Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
