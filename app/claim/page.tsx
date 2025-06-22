"use client";
import { useState } from "react";

export default function ClaimPage() {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  const fetchDetails = async () => {
    setStatus("loading");
    const res = await fetch(`/api/claim/${pin}`);
    const json = await res.json();
    if (res.ok) {
      setDetails(json);
      setStatus("confirm");
    } else {
      setStatus(json.error || "error");
    }
  };

  const completeClaim = async () => {
    setStatus("saving");
    const res = await fetch(`/api/claim/${pin}`, { method: "POST" });
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
        <div className="space-y-4 max-w-sm">
          <p className="text-green-700 text-xl font-semibold">PIN {details.pin_code} accepted</p>
          <p><strong>Guest:</strong> {details.orders?.email}</p>
          <p><strong>Item:</strong> {details.name} (qty {details.qty})</p>
          <button
            onClick={completeClaim}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Mark as claimed
          </button>
          <button onClick={reset} className="text-sm text-gray-500 underline">Cancel</button>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-4">
          <p className="text-2xl text-green-700">✅ Claimed</p>
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
