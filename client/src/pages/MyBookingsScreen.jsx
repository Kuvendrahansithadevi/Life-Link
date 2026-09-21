import React, { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Loader2, MapPin, Stethoscope, XCircle } from "lucide-react";

const statusStyles = {
  Confirmed: "bg-emerald-50 text-emerald-700",
  Completed: "bg-stone-100 text-stone-600",
  Cancelled: "bg-red-50 text-red-700",
  "Pending payment": "bg-amber-50 text-amber-700",
};

export default function MyBookingsScreen({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState("");

  const loadBookings = async () => {
    if (!currentUser?.id) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(currentUser.id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load your bookings.");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [currentUser?.id]);

  const cancelBooking = async (bookingId) => {
    setCancelling(bookingId);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not cancel appointment.");
      setBookings((items) => items.map((item) => item.id === bookingId ? { ...item, status: "Cancelled" } : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling("");
    }
  };

  return <div className="mx-auto max-w-3xl px-4 py-8">
    <h1 className="text-2xl font-semibold text-stone-900">My bookings</h1>
    <p className="mt-1 text-sm text-stone-600">View your upcoming and past appointments in one place.</p>
    {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Loading appointments...</div> : bookings.length === 0 ? <p className="mt-6 rounded-lg border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500">You do not have any bookings yet.</p> : <div className="mt-6 space-y-3">{bookings.map((booking) => { const status = booking.status || "Confirmed"; const isActive = status === "Confirmed"; return <article key={booking.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-stone-900">{booking.hospitalName}</h2><p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><MapPin className="h-3.5 w-3.5" />{booking.hospitalAddress || "Address unavailable"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Confirmed}`}>{status}</span></div><div className="mt-4 grid gap-2 text-sm text-stone-700 sm:grid-cols-2"><p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{booking.specialist}</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-emerald-600" />{booking.appointmentDate}</p><p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-emerald-600" />{booking.timeSlot}</p></div>{booking.notes && <p className="mt-3 text-xs text-stone-500">{booking.notes}</p>}<div className="mt-4 flex justify-end">{isActive ? <button onClick={() => cancelBooking(booking.id)} disabled={cancelling === booking.id} className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{cancelling === booking.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}Cancel appointment</button> : <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.hospitalName + " " + (booking.hospitalAddress || ""))}`} target="_blank" rel="noreferrer" className="rounded-md border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">Get directions</a>}</div></article>; })}</div>}
  </div>;
}
