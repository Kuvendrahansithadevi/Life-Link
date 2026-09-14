// client/src/services/api.js

const API_BASE_URL = "http://localhost:8000/api";

// 1. AI Triage API Call
export async function analyzeSymptomsAPI(text, language = "en") {
  const res = await fetch(`${API_BASE_URL}/triage/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error("Failed to analyze symptoms");
  return res.json();
}

// 2. Fetch Nearby Hospitals with distance
export async function getHospitalsAPI(lat = 13.8285, lng = 77.4913, search = "") {
  const query = new URLSearchParams({ lat, lng, search }).toString();
  const res = await fetch(`${API_BASE_URL}/hospitals?${query}`);
  if (!res.ok) throw new Error("Failed to fetch hospitals");
  return res.json();
}

// 3. Book Doctor Appointment
export async function bookAppointmentAPI(bookingData) {
  const res = await fetch(`${API_BASE_URL}/hospitals/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData),
  });
  if (!res.ok) throw new Error("Failed to book appointment");
  return res.json();
}

// 4. Blood Donors Matching
export async function matchDonorsAPI(bloodGroup) {
  const res = await fetch(`${API_BASE_URL}/donors/match?blood_group=${encodeURIComponent(bloodGroup)}`);
  if (!res.ok) throw new Error("Failed to match donors");
  return res.json();
}

// 5. Register Donor
export async function registerDonorAPI(donorData) {
  const res = await fetch(`${API_BASE_URL}/donors/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donorData),
  });
  if (!res.ok) throw new Error("Failed to register donor");
  return res.json();
}

// 6. Broadcast Blood Request
export async function broadcastBloodRequestAPI(requestData) {
  const res = await fetch(`${API_BASE_URL}/donors/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });
  if (!res.ok) throw new Error("Failed to broadcast request");
  return res.json();
}

export async function getBloodRequestsAPI() {
  const res = await fetch(`${API_BASE_URL}/donors/requests`);
  if (!res.ok) throw new Error("Failed to load blood requests");
  return res.json();
}

export async function createBloodRequestAPI(requestData) {
  const res = await fetch(`${API_BASE_URL}/donors/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to broadcast blood request");
  }
  return res.json();
}

export async function getDonorsAPI(bloodGroup = "") {
  const query = bloodGroup ? `?bloodGroup=${encodeURIComponent(bloodGroup)}` : "";
  const res = await fetch(`${API_BASE_URL}/donors${query}`);
  if (!res.ok) throw new Error("Failed to load donors");
  return res.json();
}

export async function registerUserAsDonorAPI(donorData) {
  const res = await fetch(`${API_BASE_URL}/donors/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donorData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to register donor");
  }
  return res.json();
}

export async function updateDonorStatusAPI(statusData) {
  const res = await fetch(`${API_BASE_URL}/donors/toggle-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(statusData),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update donor status");
  }
  return res.json();
}

export async function getHospitalBloodRequestsAPI() {
  const res = await fetch(`${API_BASE_URL}/donors/hospital-requests`);
  if (!res.ok) throw new Error("Failed to load hospital requests");
  return res.json();
}

// 7. Trigger Emergency Log
// Requires the logged-in user's token — the backend derives the user_id
// from this token and stores the alert against that user (see
// server/routers/emergency.py -> POST /api/emergency/alert).
export async function triggerEmergencyAlertAPI(lat, lng, message) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE_URL}/emergency/alert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ lat, lng, message }),
  });
  if (!res.ok) throw new Error("Failed to log emergency");
  return res.json();
}

// ---------------------------------------------------------------------
// Emergency Contacts (per logged-in user, backed by MongoDB)
// All calls below require a valid "Bearer token_<userId>" token, which
// the backend uses to scope every read/write to the authenticated user.
// The frontend never sends a user_id — the backend attaches it itself.
// ---------------------------------------------------------------------

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// 8. Get the current user's emergency contacts
export async function getEmergencyContactsAPI() {
  const res = await fetch(`${API_BASE_URL}/emergency/contacts`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load emergency contacts");
  return res.json();
}

// 9. Add a new emergency contact for the current user
export async function addEmergencyContactAPI({ name, phone, relation }) {
  const res = await fetch(`${API_BASE_URL}/emergency/contacts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, phone, relation }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to add emergency contact");
  }
  return res.json();
}

// 10. Update an existing emergency contact
export async function updateEmergencyContactAPI(contactId, updates) {
  const res = await fetch(`${API_BASE_URL}/emergency/contacts/${contactId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update emergency contact");
  }
  return res.json();
}

// 11. Delete an emergency contact
export async function deleteEmergencyContactAPI(contactId) {
  const res = await fetch(`${API_BASE_URL}/emergency/contacts/${contactId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete emergency contact");
  }
  return res.json();
}