import React, { useEffect, useState } from "react";
import { CheckCircle2, DollarSign, Loader2, MapPin, XCircle } from "lucide-react";

const statusStyles = { Confirmed: "bg-emerald-50 text-emerald-700", Completed: "bg-stone-100 text-stone-600", Cancelled: "bg-red-50 text-red-700", cancelled: "bg-red-50 text-red-700", pending_payment: "bg-amber-50 text-amber-700", paid: "bg-emerald-50 text-emerald-700" };
const headers = () => (localStorage.getItem("token") ? { Authorization: `Bearer ${localStorage.getItem("token")}` } : {});

export default function MyBookingsScreen({ currentUser }) {
  const [bookings, setBookings] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState(""), [cancelling, setCancelling] = useState(""), [paying, setPaying] = useState(""), [confirming, setConfirming] = useState(null);

  const loadBookings = async () => {
    if (!currentUser?.id) { setBookings([]); setLoading(false); setError("Please sign in to view your bookings."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(currentUser.id)}`, { headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Could not load your bookings.");
      if (!Array.isArray(data)) throw new Error("The bookings service returned an invalid response.");
      setBookings(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { loadBookings(); }, [currentUser?.id]);

  const continuePayment = async (bookingId) => {
    setPaying(bookingId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/bookings/payments/verify", { method: "POST", headers: { ...headers(), "Content-Type": "application/json" }, body: JSON.stringify({ booking_id: bookingId, payment_reference: `test_success_${Date.now()}` }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to continue payment. Please try again.");
      setBookings((items) => items.map((item) => item.id === bookingId ? { ...item, status: "paid", paymentStatus: "PAID" } : item));
    } catch (err) { setError(err.message); } finally { setPaying(""); }
  };

  const cancelBooking = async (bookingId) => {
    setCancelling(bookingId); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE", headers: headers() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to cancel appointment. Please try again.");
      await loadBookings();
      setConfirming(null);
      setNotice("Appointment cancelled successfully.");
    } catch (err) { setError("Unable to cancel appointment. Please try again."); } finally { setCancelling(""); }
  };

  return <div className="mx-auto max-w-3xl px-4 py-8"><h1 className="text-2xl font-semibold text-stone-900">My bookings</h1><p className="mt-1 text-sm text-stone-600">View your specialist consultations and treatment appointments.</p>{error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}{loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-stone-500"><Loader2 className="h-5 w-5 animate-spin" />Loading appointments...</div> : bookings.length === 0 ? <div className="mt-6 rounded-lg border border-dashed border-stone-300 py-12 text-center text-sm text-stone-500"><p>No bookings yet</p><p className="mt-1">Book a specialist or treatment from Find Care.</p></div> : <div className="mt-6 space-y-3">{bookings.map((booking) => <BookingCard key={booking.id} booking={booking} cancelling={cancelling} paying={paying} onPay={continuePayment} onCancel={() => setConfirming(booking)} />)}</div>}{confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 p-4"><div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"><h2 className="font-semibold">Are you sure you want to cancel this appointment?</h2><div className="mt-5 flex justify-end gap-2"><button onClick={() => setConfirming(null)} className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-semibold">Keep Appointment</button><button onClick={() => cancelBooking(confirming.id)} disabled={cancelling === confirming.id} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-stone-300">{cancelling === confirming.id ? "Cancelling..." : "Cancel Appointment"}</button></div></div></div>}</div>;
}

function BookingCard({ booking, cancelling, paying, onPay, onCancel }) {
  const status = booking.status || "Confirmed";
  const isTreatment = booking.appointmentType === "treatment";
  const offering = isTreatment ? booking.treatment : booking.specialist;
  const isPendingPayment = status === "pending_payment" && booking.paymentStatus === "PENDING";
  return <article className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-stone-900">{booking.hospitalName || "Hospital information unavailable"}</h2><p className="mt-1 flex items-center gap-1 text-xs text-stone-500"><MapPin className="h-3.5 w-3.5" />{booking.hospitalAddress || "Hospital information unavailable"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Cancelled}`}>{status}</span></div><div className="mt-4 grid gap-3 text-sm text-stone-700 sm:grid-cols-2"><p><span className="text-xs text-stone-500">Appointment type</span><br />{isTreatment ? "Treatment" : "Specialist consultation"}</p><p><span className="text-xs text-stone-500">{isTreatment ? "Treatment" : "Specialist"}</span><br />{offering || "Information unavailable"}</p>{booking.appointmentDate && <p><span className="text-xs text-stone-500">Date</span><br />{booking.appointmentDate}</p>}{booking.appointmentTime && <p><span className="text-xs text-stone-500">Time</span><br />{booking.appointmentTime}</p>}<p><span className="text-xs text-stone-500">Payment</span><br />{booking.paymentStatus === "PAID" || status === "paid" ? "PAID" : booking.paymentStatus || "PENDING"}</p><p className="flex items-start gap-1"><DollarSign className="mt-0.5 h-4 w-4 text-emerald-600" /><span><span className="text-xs text-stone-500">Amount</span><br />{booking.amount != null ? `₹${booking.amount}` : "Amount unavailable"}</span></p></div>{booking.notes && <p className="mt-3 text-xs text-stone-500">{booking.notes}</p>}{isPendingPayment && <div className="mt-4 flex justify-end gap-2"><button onClick={() => onPay(booking.id)} disabled={paying === booking.id} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:bg-stone-300">{paying === booking.id ? "Processing..." : "Continue Payment"}</button><button onClick={() => onCancel(booking.id)} disabled={cancelling === booking.id} className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{cancelling === booking.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}Cancel appointment</button></div>}</article>;
}
