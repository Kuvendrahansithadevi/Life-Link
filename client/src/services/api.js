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

// 7. Trigger Emergency Log
export async function triggerEmergencyAlertAPI(lat, lng, message) {
  const res = await fetch(`${API_BASE_URL}/emergency/alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lng, message }),
  });
  if (!res.ok) throw new Error("Failed to log emergency");
  return res.json();
}