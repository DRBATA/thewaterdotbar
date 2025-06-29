"use client";

import { useState } from "react";

export default function ResendButton({
  orderId,
  email,
}: {
  orderId: string;
  email: string;
}) {
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleResend() {
    setIsSending(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/resend-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend ticket");
      }

      setStatus("success");
    } catch (error) {
      console.error("Error resending ticket:", error);
      setStatus("error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleResend}
        disabled={isSending}
        className={`px-3 py-1.5 text-xs font-medium rounded 
          ${isSending ? "bg-stone-300 cursor-not-allowed" : "bg-stone-600 hover:bg-stone-700 text-white"}
        `}
      >
        {isSending ? "Sending..." : "Resend Ticket"}
      </button>

      {status === "success" && (
        <div className="text-xs text-green-600 mt-1">
          Sent to {email.substring(0, 10)}
          {email.length > 10 ? "..." : ""}
        </div>
      )}
      {status === "error" && (
        <div className="text-xs text-red-600 mt-1">Failed to send</div>
      )}
    </div>
  );
}
