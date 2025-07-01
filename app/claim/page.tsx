"use client";
import { useState } from "react";

export default function ClaimPage() {
  const isEventLive = process.env.NEXT_PUBLIC_EVENT_LIVE === 'true';

  if (!isEventLive) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-md shadow-lg max-w-md mx-auto" role="alert">
          <h1 className="font-bold text-2xl mb-2">The Event is Now Over</h1>
          <p className="text-lg">PIN claims are no longer being accepted. Thank you for attending!</p>
        </div>
      </main>
    );
  }
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [emailOk, setEmailOk] = useState(false);
  const [tokenOk, setTokenOk] = useState(false);
  const [redemptionChoice, setRedemptionChoice] = useState<string>("");

  const fetchDetails = async () => {
    setStatus("loading");
    const res = await fetch(`/api/claim/${pin}`);
    const json = await res.json();
    if (res.ok) {
      setDetails(json);
      setStatus("confirm");
      setEmailOk(false);
      setTokenOk(false);
    } else {
      setStatus(json.error || "error");
    }
  };

  const completeClaim = async () => {
    if (!emailOk || !tokenOk) return;
    setStatus("saving");
    const res = await fetch(`/api/claim/${pin}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redemption_choice: redemptionChoice }),
    });
    const json = await res.json();
    if (res.ok) {
      setStatus("done");
    } else {
      setStatus(json.error || "error");
    }
  };

  const reset = () => {
    setPin("");
    setStatus(null);
    setDetails(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-6">Claim Page</h1>
      {status === null && (
        <div className="space-y-4">
          <input
            type="number"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 4))}
            className="border p-2 text-center text-xl w-40"
            placeholder="PIN"
          />
          <button
            onClick={fetchDetails}
            disabled={pin.length !== 4}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Redeem
          </button>
        </div>
      )}

      {status === "loading" && <p>Loading…</p>}

      {status === "confirm" && details && (
        <div className="space-y-4 max-w-sm text-left">
          <p className="text-green-700 text-xl font-semibold text-center">PIN {details.pin_code} accepted</p>
          <p><strong>Guest email:</strong> {details.orders?.email}</p>
          <p><strong>Item:</strong> {details.name} (qty {details.qty})</p>

          {details.name === 'ticket.drink' && (
            <div className="py-2">
              <label htmlFor="drink-choice" className="block text-sm font-medium text-gray-700">Select Drink</label>
              <select
                id="drink-choice"
                value={redemptionChoice}
                onChange={(e) => setRedemptionChoice(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>-- Choose a drink --</option>
                <option value="Kyoto Kooler">Kyoto Kooler</option>
                <option value="The Alchemist">The Alchemist</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {details.name === 'ticket.wellness.flex' && (
            <div className="py-2">
              <label htmlFor="wellness-choice" className="block text-sm font-medium text-gray-700">Select Wellness Experience</label>
              <select
                id="wellness-choice"
                value={redemptionChoice}
                onChange={(e) => setRedemptionChoice(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>-- Choose an experience --</option>
                <option value="Breathwork">Breathwork</option>
                <option value="Meditation">Meditation</option>
                <option value="Yoga">Yoga</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
          <div className="space-y-2 py-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={emailOk} onChange={() => setEmailOk(!emailOk)} />
              <span>Email confirmed</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" checked={tokenOk} onChange={() => setTokenOk(!tokenOk)} />
              <span>Token / drink handed over</span>
            </label>
          </div>
          <button
            onClick={completeClaim}
            disabled={!emailOk || !tokenOk}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-40 w-full"
          >
            Complete & mark claimed
          </button>
          <button onClick={reset} className="text-sm text-gray-500 underline w-full text-center">Cancel</button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <p className="text-2xl text-green-700 text-center">✅ {details?.name || "Item"} claimed</p>
          <button onClick={reset} className="underline text-blue-600">Scan next PIN</button>
        </div>
      )}

      {status && ["error", "Invalid or already claimed"].includes(status) && (
        <div className="space-y-4">
          <p className="text-red-700">{status}</p>
          <button onClick={reset} className="underline text-blue-600">Try again</button>
        </div>
      )}
    </main>
  );
}
