import React, { useEffect, useState } from "react";
import { CircleDollarSign, Loader2, LogOut, MessageCircle, Send, Stethoscope, XCircle } from "lucide-react";

const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });

export default function DoctorDashboardScreen({ currentUser, onLogout }) {
  const [chats, setChats] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await fetch("/api/doctor/chats", { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load doctor queue.");
      setChats(data.chats || []);
      setEarnings(data.earnings || 0);
      setError("");
      if (!selectedId && data.chats?.[0]) setSelectedId(data.chats[0].id);
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
  }, []);

  const selected = chats.find((chat) => chat.id === selectedId) || chats[0];

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/doctor/chat/${selected.id}/reply`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ text: reply })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not send reply.");

      setChats((items) => items.map((item) => item.id === selected.id ? data.chat : item));
      setReply("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const closeChat = async () => {
    if (!selected) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch(`/api/doctor/chat/${selected.id}/close`, {
        method: "POST",
        headers: headers()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not end consultation.");

      setChats((items) => items.filter((item) => item.id !== selected.id));
      setSelectedId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">LIFE LINK Doctor Portal</p>
              <p className="text-xs text-stone-500">{currentUser?.username || "Care team"}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-medium">
            <LogOut className="h-3.5 w-3.5" />Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Clinical workspace</p>
            <h1 className="mt-1 text-2xl font-semibold">Patient conversations</h1>
            <p className="mt-1 text-sm text-stone-600">Respond to active LIFE LINK consultations.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <CircleDollarSign className="h-5 w-5" />
            <span>
              <span className="block text-[11px] font-semibold uppercase tracking-wide">Earnings</span>
              <b className="text-xl">{earnings.toFixed(2)} credits</b>
            </span>
          </div>
        </div>

        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-stone-500">
            <Loader2 className="h-5 w-5 animate-spin" />Loading patient queue...
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="text-sm font-semibold">Active queue</h2>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{chats.length}</span>
              </div>
              {chats.length ? (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedId(chat.id)}
                    className={`mt-2 w-full rounded-xl border p-3 text-left ${selected?.id === chat.id ? "border-emerald-400 bg-emerald-50/50" : "border-stone-200"}`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-emerald-700" />
                      <span className="text-sm font-semibold">Patient consultation</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-stone-500">{chat.messages?.[chat.messages.length - 1]?.text || "New request"}</p>
                    <p className="mt-2 text-[11px] text-stone-400">{chat.specialization || "General"} · {chat.spentCredits || 5} credits</p>
                  </button>
                ))
              ) : (
                <p className="px-2 py-10 text-center text-sm text-stone-500">No active requests.</p>
              )}
            </aside>

            <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm flex flex-col justify-between">
              <header className="border-b border-stone-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selected ? "Patient consultation" : "Waiting for a request"}</h2>
                  <p className="text-xs text-stone-500">{selected ? `${selected.specialization} · Active Session` : "New patient requests will appear here."}</p>
                </div>
                {selected && (
                  <button
                    onClick={closeChat}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4" /> End Consultation
                  </button>
                )}
              </header>

              <div className="min-h-[360px] max-h-[400px] overflow-y-auto space-y-3 bg-stone-50/70 p-5">
                {selected ? (
                  selected.messages.map((message, index) => (
                    <div key={`${message.timestamp}-${index}`} className={`flex ${message.sender === "doctor" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender === "doctor" ? "rounded-br-sm bg-emerald-700 text-white" : "rounded-bl-sm border border-stone-200 bg-white"}`}>
                        <p>{message.text}</p>
                        <p className={`mt-1 text-[10px] ${message.sender === "doctor" ? "text-emerald-100" : "text-stone-400"}`}>
                          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-stone-500">Select an active patient request to begin.</div>
                )}
              </div>

              {selected && (
                <footer className="border-t border-stone-100 p-4 bg-white">
                  <div className="flex gap-2">
                    <input
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && sendReply()}
                      placeholder="Write a clinical response..."
                      className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                    />
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      aria-label="Send reply"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white disabled:bg-stone-300"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
