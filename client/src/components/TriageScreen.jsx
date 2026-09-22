import React, { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Image as ImageIcon,
  X,
  MapPin,
  Calendar,
  Phone,
} from "lucide-react";

export default function TriageScreen({ onTriggerEmergency, onSelectHospitalForBooking, currentUser }) {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyBookingState, setEmergencyBookingState] = useState("idle");
  const [emergencyBookingError, setEmergencyBookingError] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // Real Web Speech API
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === "te" ? "te-IN" : language === "hi" ? "hi-IN" : "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!input.trim() && !selectedImage) return;

    setLoading(true);
    setResult(null);
    setError("");

    const formData = new FormData();
    formData.append("text", input);
    formData.append("language", language);
    if (selectedImage) formData.append("image", selectedImage);

    // Get live coordinates if allowed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendRequest(formData, pos.coords.latitude, pos.coords.longitude),
        () => sendRequest(formData, 16.9891, 82.2475)
      );
    } else {
      sendRequest(formData, 16.9891, 82.2475);
    }
  };

  const sendRequest = async (formData, lat, lng) => {
    formData.append("lat", lat);
    formData.append("lng", lng);

    try {
      const response = await fetch("/api/triage/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to process triage analysis.");
      const data = await response.json();
      setResult(data);

      if (data.triggerEmergency === true) {
        setShowEmergencyModal(true);
      }
    } catch (err) {
      console.error("Triage request failed:", err);
      setError("We couldn't reach the triage service. Please check that the backend is running and try again.");
    } finally {
      setLoading(false);
    }
  };

  const urgentHospital = result?.suggested_hospitals?.[0];
  const emergencyDetected = result?.triggerEmergency === true;

  const bookUrgentHospital = async () => {
    if (!urgentHospital || !currentUser?.id) {
      setEmergencyBookingError("Please sign in before booking urgent care.");
      return;
    }
    setEmergencyBookingState("saving");
    setEmergencyBookingError("");
    const today = new Date().toISOString().slice(0, 10);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          hospitalId: urgentHospital.id,
          hospitalName: urgentHospital.name,
          specialist: result.specialist || "Emergency Medicine",
          appointmentDate: today,
          timeSlot: "Immediate emergency intake",
          patientName: currentUser.username || "Emergency patient",
          notes: `Urgent triage: ${result.guidance || "High urgency symptoms"}`,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not book urgent care.");
      setEmergencyBookingState("booked");
    } catch (err) {
      setEmergencyBookingError(err.message);
      setEmergencyBookingState("idle");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" /> AI Medical Triage
        </span>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">Explain your symptoms</h1>
        <p className="mt-1 text-sm text-stone-500">
          Describe what you are experiencing or upload an image for immediate clinical triage and home remedies.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <span className="text-xs font-medium text-stone-500">Select language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-md border border-stone-300 px-2 py-1 text-xs outline-none focus:border-emerald-600"
          >
            <option value="en">English</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>

        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. I have severe pain in my heart radiating to my left arm, sweating, and difficulty breathing..."
          className="mt-3 w-full resize-none rounded-xl border border-stone-200 p-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />

        {/* Image Preview Thumbnail */}
        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="Selected" className="h-20 w-20 rounded-lg object-cover border border-stone-200" />
            <button
              onClick={clearImage}
              className="absolute -right-1.5 -top-1.5 rounded-full bg-stone-800 p-0.5 text-white hover:bg-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                isListening ? "bg-red-600 text-white animate-pulse" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isListening ? "Listening..." : "Speak"}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200"
            >
              <ImageIcon className="h-4 w-4 text-stone-600" />
              {selectedImage ? "Change photo" : "Add photo"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || (!input.trim() && !selectedImage)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 disabled:bg-stone-300"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Get guidance
          </button>
        </div>
        {loading && (
          <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-800" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your symptoms...
          </p>
        )}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      </div>

      {/* Triage Results Display */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Urgency Badge Header */}
          <div
            className={`flex items-center justify-between rounded-xl p-4 border ${
              emergencyDetected || result.urgency === "High" || result.urgency === "Critical"
                ? "bg-red-50 border-red-200 text-red-800"
                : result.urgency === "Medium"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <div className="flex items-center gap-3">
              {emergencyDetected || result.urgency === "High" || result.urgency === "Critical" ? (
                <ShieldAlert className="h-6 w-6 text-red-600" />
              ) : result.urgency === "Medium" ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              )}
              <div>
                <h3 className="font-bold text-sm">Urgency Level: {result.urgency}</h3>
                <p className="text-xs opacity-90">{result.guidance}</p>
              </div>
            </div>
          </div>

          {result.disease_name && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-800">Predicted Condition</p>
                  <h3 className="mt-1 text-lg font-bold text-sky-950">{result.disease_name}</h3>
                  {result.cause && <p className="mt-2 text-sm leading-6 text-sky-900"><span className="font-semibold">Likely cause:</span> {result.cause}</p>}
                  {result.visual_findings && result.visual_findings !== "none" && (
                    <p className="mt-2 text-xs leading-5 text-sky-800"><span className="font-semibold">Visual findings:</span> {result.visual_findings}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Home Remedies & First-Aid Section */}
          {result.remedies && result.remedies.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Immediate Care & Home Remedies
              </h4>
              <ul className="mt-3 space-y-2">
                {result.remedies.map((remedy, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{remedy}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Precautions Section */}
          {result.precautions && result.precautions.length > 0 && (
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" /> Critical Precautions (What to Avoid)
              </h4>
              <ul className="mt-3 space-y-2">
                {result.precautions.map((prec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" />
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Specialist & Closest Care */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
                <Stethoscope className="h-4 w-4 text-emerald-700" /> Recommended Specialist: {result.specialist}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {result.suggested_hospitals?.map((h) => {
                const hospitalId = h.id || h._id || h.hospitalId;
                return (
                <div key={hospitalId} className="flex items-center justify-between rounded-lg border border-stone-100 bg-stone-50 p-3">
                  <div>
                    <h5 className="text-sm font-semibold text-stone-900">{h.name}</h5>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                      <MapPin className="h-3 w-3" /> {h.address} · {h.distance}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectHospitalForBooking && hospitalId && onSelectHospitalForBooking({ ...h, id: String(hospitalId) })}
                    className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Book
                  </button>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showEmergencyModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/80 p-4" role="dialog" aria-modal="true" aria-labelledby="critical-emergency-title">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border-2 border-red-400 bg-white shadow-2xl shadow-red-950/60">
            <div className="animate-pulse bg-red-700 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-7 w-7 shrink-0" />
                <div>
                  <h2 id="critical-emergency-title" className="text-lg font-black tracking-wide">EMERGENCY DETECTED</h2>
                  <p className="mt-1 text-xs font-semibold text-red-100">Seek immediate medical care. Do not wait for symptoms to improve.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-stone-700">Your symptoms may require immediate medical attention. Call emergency services now if you are in immediate danger.</p>
              <a href="tel:108" className="flex items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-3 text-base font-bold text-white shadow-lg shadow-red-900/20 hover:bg-red-600">
                <Phone className="h-5 w-5" /> Call Ambulance (108)
              </a>
              {urgentHospital ? (
                <button onClick={bookUrgentHospital} disabled={emergencyBookingState === "saving" || emergencyBookingState === "booked"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-600 disabled:bg-stone-300">
                  {emergencyBookingState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                  {emergencyBookingState === "booked" ? "Urgent care booked" : `Book urgent care at ${urgentHospital.name}`}
                </button>
              ) : <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">No nearby high-care hospital was returned. Call 108 immediately.</p>}
              {emergencyBookingError && <p className="text-xs font-medium text-red-700">{emergencyBookingError}</p>}
              {urgentHospital && <p className="flex items-start gap-2 text-xs text-stone-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{urgentHospital.name} · {urgentHospital.address}</p>}
              <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={() => onTriggerEmergency?.(result)} className="text-left text-xs font-semibold uppercase tracking-wide text-red-700 hover:text-red-600">Open full Emergency Mode</button>
                <button onClick={() => setShowEmergencyModal(false)} className="rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">I understand, close alert</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}