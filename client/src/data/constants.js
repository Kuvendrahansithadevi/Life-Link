/* Mock data and translation strings for LIFE LINK.
   In a real deployment, replace these with API calls to your backend. */

/* ------------------------------------------------------------------ */
/*  TRANSLATIONS                                                       */
/* ------------------------------------------------------------------ */

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "te", label: "తెలుగు" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

export const STRINGS = {
  en: {
    tagline: "Every second, we're with you.",
    navTriage: "Symptom Check",
    navHospitals: "Find Care",
    navBlood: "Blood Network",
    navProfile: "Profile",
    emergencyBtn: "Emergency",
    exitEmergency: "Exit Emergency Mode",
    logout: "Log out",
  },
  te: {
    tagline: "ప్రతి క్షణం, మేము మీతో ఉన్నాము.",
    navTriage: "లక్షణాల తనిఖీ",
    navHospitals: "సంరక్షణ కనుగొనండి",
    navBlood: "రక్త నెట్‌వర్క్",
    navProfile: "ప్రొఫైల్",
    emergencyBtn: "అత్యవసరం",
    exitEmergency: "అత్యవసర మోడ్ నిష్క్రమించండి",
    logout: "లాగ్ అవుట్",
  },
  hi: {
    tagline: "हर पल, हम आपके साथ हैं।",
    navTriage: "लक्षण जांच",
    navHospitals: "देखभाल खोजें",
    navBlood: "रक्त नेटवर्क",
    navProfile: "प्रोफ़ाइल",
    emergencyBtn: "आपातकाल",
    exitEmergency: "आपातकालीन मोड से बाहर निकलें",
    logout: "लॉग आउट",
  },
  ta: {
    tagline: "ஒவ்வொரு நொடியும், நாங்கள் உங்களுடன் இருக்கிறோம்.",
    navTriage: "அறிகுறி சோதனை",
    navHospitals: "சிகிச்சை தேடு",
    navBlood: "இரத்த வலையமைப்பு",
    navProfile: "சுயவிவரம்",
    emergencyBtn: "அவசரநிலை",
    exitEmergency: "அவசர பயன்முறையிலிருந்து வெளியேறு",
    logout: "வெளியேறு",
  },
  kn: {
    tagline: "ಪ್ರತಿ ಕ್ಷಣ, ನಾವು ನಿಮ್ಮೊಂದಿಗಿದ್ದೇವೆ.",
    navTriage: "ಲಕ್ಷಣ ಪರಿಶೀಲನೆ",
    navHospitals: "ಆರೈಕೆ ಹುಡುಕಿ",
    navBlood: "ರಕ್ತ ಜಾಲ",
    navProfile: "ಪ್ರೊಫೈಲ್",
    emergencyBtn: "ತುರ್ತುಸ್ಥಿತಿ",
    exitEmergency: "ತುರ್ತು ಮೋಡ್‌ನಿಂದ ನಿರ್ಗಮಿಸಿ",
    logout: "ಲಾಗ್ ಔಟ್",
  },
};

/*  MOCK DATA                                                          */
/* ------------------------------------------------------------------ */

export const HOSPITALS = [
  {
    id: "h1",
    name: "Sri Sathya Sai Institute of Higher Medical Sciences",
    distance: "1.8 km",
    address: "Prasanthigram Rd, Puttaparthi",
    phone: "+91 8555 287777",
    specialists: ["Cardiologist", "General Physician", "Neurologist"],
    availableNow: true,
    rating: 4.6,
    waitTime: "12 min",
  },
  {
    id: "h2",
    name: "Apollo Hospitals",
    distance: "3.2 km",
    address: "Ring Road, Hindupur",
    phone: "+91 8556 244100",
    specialists: ["Orthopedic", "General Physician", "Pediatrician"],
    availableNow: true,
    rating: 4.4,
    waitTime: "20 min",
  },
  {
    id: "h3",
    name: "Government General Hospital",
    distance: "4.0 km",
    address: "Bus Stand Road, Hindupur",
    phone: "+91 8556 220011",
    specialists: ["General Physician", "Trauma & Emergency"],
    availableNow: true,
    rating: 3.9,
    waitTime: "35 min",
  },
  {
    id: "h4",
    name: "NRI Multispeciality Hospital",
    distance: "6.5 km",
    address: "NH44, Anantapur Road",
    phone: "+91 8554 278899",
    specialists: ["Cardiologist", "Nephrologist", "General Physician"],
    availableNow: false,
    rating: 4.2,
    waitTime: "—",
  },
  {
    id: "h5",
    name: "Sunrise Diagnostic & Care Centre",
    distance: "7.1 km",
    address: "Gandhi Nagar, Hindupur",
    phone: "+91 8556 231234",
    specialists: ["Dermatologist", "ENT Specialist", "General Physician"],
    availableNow: true,
    rating: 4.1,
    waitTime: "8 min",
  },
];

export const TRIAGE_RULES = [
  {
    keywords: ["chest pain", "can't breathe", "cannot breathe", "difficulty breathing", "unconscious", "not breathing", "severe bleeding", "stroke", "seizure", "collapsed"],
    urgency: "High",
    specialist: "Cardiologist / Emergency Medicine",
    guidance:
      "These symptoms can indicate a life-threatening event. Do not wait for a scheduled appointment — call 108 or go to the nearest emergency room right now. If you're with someone showing these signs, keep them still and calm while help is on the way.",
  },
  {
    keywords: ["fever", "vomiting", "stomach pain", "abdominal pain", "dizziness", "rash", "high temperature", "diarrhea"],
    urgency: "Medium",
    specialist: "General Physician",
    guidance:
      "Your symptoms should be looked at within the next few hours, especially if they're getting worse. Stay hydrated and rest. Book an appointment with a general physician, and seek emergency care immediately if you develop chest pain, confusion, or a fever above 103°F (39.4°C).",
  },
  {
    keywords: ["headache", "cold", "cough", "sore throat", "fatigue", "runny nose", "body ache", "mild pain"],
    urgency: "Low",
    specialist: "General Physician",
    guidance:
      "Your symptoms sound manageable at home for now. Rest, fluids, and over-the-counter relief are usually enough. If symptoms persist beyond 3–4 days or worsen, schedule a visit with a general physician.",
  },
];

export const DEFAULT_TRIAGE = {
  urgency: "Medium",
  specialist: "General Physician",
  guidance:
    "We couldn't match specific patterns in what you described. It's best to have a general physician review your symptoms in person, especially if anything feels unusual or is getting worse.",
};

export const VOICE_SAMPLE =
  "I've had a tight, uncomfortable pain in my chest for the last twenty minutes, and I feel a bit short of breath.";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const COMPATIBLE_DONORS = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

export const DONORS = [
  { id: "d1", name: "Ravi Teja", bloodGroup: "O+", location: "Hindupur Town", distance: "1.1 km", phone: "+91 90000 11111", lastDonated: "3 months ago" },
  { id: "d2", name: "Lakshmi Priya", bloodGroup: "A+", location: "APSP Colony", distance: "2.4 km", phone: "+91 90000 22222", lastDonated: "5 months ago" },
  { id: "d3", name: "Mohammed Irfan", bloodGroup: "O-", location: "Gandhi Nagar", distance: "3.0 km", phone: "+91 90000 33333", lastDonated: "6 months ago" },
  { id: "d4", name: "Sunitha Reddy", bloodGroup: "B+", location: "Ashok Nagar", distance: "3.6 km", phone: "+91 90000 44444", lastDonated: "2 months ago" },
  { id: "d5", name: "Karthik N.", bloodGroup: "AB+", location: "Bus Stand Road", distance: "4.2 km", phone: "+91 90000 55555", lastDonated: "8 months ago" },
  { id: "d6", name: "Fathima Begum", bloodGroup: "A-", location: "Kothapet", distance: "5.0 km", phone: "+91 90000 66666", lastDonated: "1 month ago" },
  { id: "d7", name: "Suresh Babu", bloodGroup: "O+", location: "Penukonda Road", distance: "5.8 km", phone: "+91 90000 77777", lastDonated: "4 months ago" },
  { id: "d8", name: "Divya Sree", bloodGroup: "B-", location: "Parigi", distance: "6.4 km", phone: "+91 90000 88888", lastDonated: "7 months ago" },
];

export const HOSPITAL_BLOOD_REQUESTS = [
  { id: "hr1", hospital: "Government General Hospital", location: "Bus Stand Road, Hindupur", bloodGroup: "O-", quantity: 2, distance: "4.0 km", postedAgo: "40 min ago", contact: "+91 8556 220011" },
  { id: "hr2", hospital: "Apollo Hospitals", location: "Ring Road, Hindupur", bloodGroup: "B+", quantity: 3, distance: "3.2 km", postedAgo: "1 hr ago", contact: "+91 8556 244100" },
  { id: "hr3", hospital: "Sri Sathya Sai Institute of Higher Medical Sciences", location: "Prasanthigram Rd, Puttaparthi", bloodGroup: "A+", quantity: 1, distance: "1.8 km", postedAgo: "2 hr ago", contact: "+91 8555 287777" },
  { id: "hr4", hospital: "NRI Multispeciality Hospital", location: "NH44, Anantapur Road", bloodGroup: "AB-", quantity: 2, distance: "6.5 km", postedAgo: "3 hr ago", contact: "+91 8554 278899" },
  { id: "hr5", hospital: "Sunrise Diagnostic & Care Centre", location: "Gandhi Nagar, Hindupur", bloodGroup: "O+", quantity: 1, distance: "7.1 km", postedAgo: "5 hr ago", contact: "+91 8556 231234" },
];

// NOTE: Emergency contacts are no longer seeded/hardcoded here. They are
// stored per-user in MongoDB and fetched via /api/emergency/contacts
// (see client/src/services/api.js and server/routers/emergency.py).

export const TRAUMA_CENTER = {
  name: "Government General Hospital — Trauma & Emergency Unit",
  distance: "4.0 km",
  eta: "9–12 min",
  lat: 13.8285,
  lng: 77.4913,
};

/* Mock "database" seeds for auth. Passwords are kept in memory only — this
   is a front-end prototype with no real backend or encryption. */
export const ADMIN_CREDENTIALS = { username: "admin", password: "admin@108" };

export const SEED_USERS = [
  {
    id: "u1",
    username: "asha.rao",
    email: "asha.rao@example.com",
    password: "password123",
    address: "12 Ring Road, Hindupur",
    phone: "+91 90000 12345",
    bloodGroup: "O+",
    profileImage: null,
    isDonor: false,
    joined: "Jan 2026",
  },
];

export const SEED_REQUESTS = [
  { id: "r0", bloodGroup: "B+", location: "Government General Hospital, Hindupur", quantity: 2, postedBy: "Ward 4 Nurse Station", time: "18 min ago" },
];
