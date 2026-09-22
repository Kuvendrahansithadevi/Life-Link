import React, { useEffect, useState } from "react";
import {
  CircleDollarSign,
  MessageCircle,
  Send,
  Stethoscope,
} from "lucide-react";
import { authHeaders } from "../services/api";

const headers = authHeaders;

export default function DoctorChatScreen({ currentUser }) {
  const [chat, setChat] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [credits, setCredits] = useState(currentUser?.credits ?? null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [sessionEnded, setSessionEnded] = useState(false);

  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        const response = await fetch("/api/doctors/specializations");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.detail || "Could not load doctor specializations.");
        const options = Array.isArray(data.specializations)
          ? data.specializations
          : [];
        setSpecializations(options);
        setSpecialization((current) => current || options[0] || "");
      } catch (err) {
        setError(err.message);
      }
    };

    loadSpecializations();
  }, []);

  const load = async () => {
    try {
      const [chatResponse, walletResponse] = await Promise.all([
        fetch("/api/chat/active", { headers: headers() }),
        fetch("/api/user/wallet", { headers: headers() }),
      ]);
      const chatData = await chatResponse.json();
      const walletData = await walletResponse.json();
      if (!chatResponse.ok)
        throw new Error(chatData.detail || "Could not load your consultation.");
      if (!walletResponse.ok)
        throw new Error(
          walletData.detail || "Could not load your credit wallet.",
        );
      setChat((previousChat) => {
        if (previousChat?.id && !chatData) setSessionEnded(true);
        return chatData;
      });
      setCredits(walletData.credits);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      let consultationId = chat?.id;
      if (!consultationId) {
        const startResponse = await fetch("/api/chat/start", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ specialization }),
        });
        const startData = await startResponse.json();
        if (!startResponse.ok)
          throw new Error(startData.detail || "Could not start consultation.");
        consultationId = startData.chat.id;
        setChat(startData.chat);
        setCredits(startData.credits);
        setSessionEnded(false);
      }

      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          text: text.trim(),
          consultation_id: consultationId,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "Could not send message.");
      setChat(data.chat);
      setCredits(data.credits);
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Professional care
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Doctor chat</h1>
          <p className="mt-1 text-sm text-stone-600">
            Start a consultation for 5 Health Credits, then message freely
            during the active session.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <CircleDollarSign className="h-5 w-5" />
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-wide">
              Health Credits
            </span>
            <b className="text-xl">{credits ?? "--"}</b>
          </span>
        </div>
      </div>
      {error && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {sessionEnded && !chat && (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Your doctor ended this consultation. Choose a specialization and send a new message to start another session for {5} credits.
        </p>
      )}
      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">
              {chat?.doctorName || "On-call doctor"}
            </h2>
            <p className="text-xs text-stone-500">
              {chat?.specialization || "A doctor will join your consultation"}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {chat?.status || "Ready"}
          </span>
        </header>
        <div className="min-h-[360px] space-y-3 bg-stone-50/70 p-5">
          {loading ? (
            <p className="py-24 text-center text-sm text-stone-500">
              Loading consultation...
            </p>
          ) : !chat ? (
            <div className="flex h-72 flex-col items-center justify-center text-center">
              <MessageCircle className="h-10 w-10 text-emerald-600" />
              <label className="mt-3 text-left text-sm font-semibold">
                Medical specialization
                <select
                  value={specialization}
                  onChange={(event) => setSpecialization(event.target.value)}
                  className="mt-2 block w-64 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-emerald-600"
                >
                  {!specializations.length && (
                    <option value="">Loading doctor specializations...</option>
                  )}
                  {specializations.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1 max-w-sm text-sm text-stone-500">
                Send your first message and we will route it to an available matching doctor.
              </p>
            </div>
          ) : (
            chat.messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender === "user" ? "rounded-br-sm bg-emerald-700 text-white" : "rounded-bl-sm border border-stone-200 bg-white text-stone-800"}`}
                >
                  <p>{message.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${message.sender === "user" ? "text-emerald-100" : "text-stone-400"}`}
                  >
                    {message.sender === "user" && message.creditCost
                      ? `-${message.creditCost} credits · `
                      : ""}
                    {message.timestamp
                      ? new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <footer className="border-t border-stone-100 p-4">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && send()}
              placeholder="Describe what you need help with..."
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim() || !specialization}
              aria-label="Send message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:bg-stone-300"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Messages are included while this consultation session is active.
          </p>
        </footer>
      </section>
    </div>
  );
}
