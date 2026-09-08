import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Send,
  Stethoscope,
  Siren,
} from "lucide-react";
import { VOICE_SAMPLE } from "../data/constants";
import { runTriage, urgencyStyles } from "../utils/helpers";

export default function TriageScreen({ onTrigger }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startVoice = () => {
    if (listening) return;
    setListening(true);
    timerRef.current = setTimeout(() => {
      setText((prev) => (prev ? prev + " " + VOICE_SAMPLE : VOICE_SAMPLE));
      setListening(false);
    }, 1800);
  };

  const stopVoice = () => {
    clearTimeout(timerRef.current);
    setListening(false);
  };

  const submit = () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(runTriage(text));
      setLoading(false);
    }, 1100);
  };

  const reset = () => {
    setText("");
    setResult(null);
  };

  const styles = result ? urgencyStyles[result.urgency] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Describe what you're feeling</h1>
        <p className="mt-1 text-sm text-stone-600">
          Type or speak your symptoms in your own words. Our assistant will estimate urgency and point you to the
          right kind of care.
        </p>
      </div>

      {!result && !loading && (
        <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="e.g. I've had a dull headache since this morning and feel tired..."
            className="w-full resize-none rounded-lg border border-stone-200 p-3 text-sm text-stone-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={listening ? stopVoice : startVoice}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                listening
                  ? "border-red-300 bg-red-50 text-red-700"
                  : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {listening ? "Listening… tap to stop" : "Speak your symptoms"}
            </button>
            <button
              onClick={submit}
              disabled={!text.trim()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/20 hover:from-emerald-500 hover:to-emerald-600 disabled:cursor-not-allowed disabled:from-stone-300 disabled:to-stone-300"
            >
              <Send className="h-4 w-4" />
              Get guidance
            </button>
          </div>
          {listening && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" /> Simulated voice capture in
              progress…
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-100 bg-white py-14">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-stone-500">Analyzing what you described…</p>
        </div>
      )}

      {result && !loading && (
        <div>
          <div className={`rounded-xl border-l-4 ${styles.border} ${styles.bg} p-5 shadow-sm`}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
              <span className={`text-sm font-semibold uppercase tracking-wide ${styles.text}`}>
                {result.urgency} urgency
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-800">{result.guidance}</p>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
              <Stethoscope className="h-4 w-4 shrink-0 text-emerald-700" />
              <span className="text-sm text-stone-800">
                Recommended: <span className="font-medium">{result.specialist}</span>
              </span>
            </div>
          </div>

          {result.urgency === "High" && (
            <button
              onClick={onTrigger}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white shadow-md shadow-red-900/30 ring-1 ring-red-400/40 hover:bg-red-500"
            >
              <Siren className="h-4 w-4" />
              These sound serious — switch to Emergency Mode
            </button>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={reset}
              className="flex-1 rounded-lg border border-emerald-200 py-2.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Describe something else
            </button>
          </div>

          <p className="mt-6 rounded-lg bg-stone-100 p-3 text-xs leading-relaxed text-stone-500">
            <strong className="text-stone-700">Medical disclaimer:</strong> LIFE LINK's symptom check is a triage
            assistant, not a definitive medical diagnosis. It does not replace evaluation by a licensed clinician.
            If you believe you are having a medical emergency, call 108 or go to the nearest emergency room
            immediately.
          </p>
        </div>
      )}
    </div>
  );
}

