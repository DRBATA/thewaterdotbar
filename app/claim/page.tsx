"use client";
import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from '@headlessui/react'
import { createClient } from "@supabase/supabase-js";
import EmailVerification from "../../components/EmailVerification";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Main claim page component
export default function ClaimPage() {
  const isEventLive = process.env.NEXT_PUBLIC_EVENT_LIVE === 'true';
  
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [emailOk, setEmailOk] = useState(false);
  const [tokenOk, setTokenOk] = useState(false);
  const [redemptionChoice, setRedemptionChoice] = useState<string>("");
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  
  // Venue state
  const [venues, setVenues] = useState<Array<{id: string; name: string}>>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  
  // Fetch venues from Supabase
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoadingVenues(true);
      try {
        const { data, error } = await supabase
          .from("venue")
          .select("id, name")
          // Only fetch active venues (today falls within from_date and to_date or to_date is null)
          .or(`from_date.lte.${new Date().toISOString().split('T')[0]},from_date.is.null`)
          .or(`to_date.gte.${new Date().toISOString().split('T')[0]},to_date.is.null`)
          .order('name');
          
        if (error) {
          console.error("Error fetching venues:", error);
        } else {
          setVenues(data || []);
          if (data && data.length > 0) {
            setSelectedVenueId(data[0].id); // Default select the first venue
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching venues:", err);
      } finally {
        setIsLoadingVenues(false);
      }
    };
    
    fetchVenues();
  }, []);
  
  const fetchDetails = async () => {
    setStatus("loading");
    const res = await fetch(`/api/claim/${pin}`);
    const json = await res.json();
    if (res.ok) {
      if (json.type === 'email_verification') {
        setDetails(json);
        setStatus("email_verification");
      } else {
        setDetails(json);
        setStatus("confirm");
        setEmailOk(false);
        setTokenOk(false);
      }
    } else {
      setStatus(json.error || "error");
    }
  };

  const handleEmailVerified = (orderItem: any) => {
    setDetails(orderItem);
    setStatus("confirm");
    setEmailOk(false);
    setTokenOk(false);
  };

  const handleEmailError = (error: string) => {
    setStatus(error);
  };

  const completeClaim = async () => {
    if (!emailOk || !tokenOk || !selectedVenueId) return;
    setStatus("saving");
    const res = await fetch(`/api/claim/${pin}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        redemption_choice: redemptionChoice,
        venue_id: selectedVenueId 
      }),
    });
    const json = await res.json();
    if (res.ok) {
      setStatus("done");
    } else {
      setStatus(json.error || "error");
    }
  };

    const handleResend = async () => {
    setResendStatus('sending');
    try {
      const response = await fetch('/api/email/resend-unclaimed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (!response.ok) {
        throw new Error('Failed to send email.');
      }
      setResendStatus('sent');
    } catch (error) {
      setResendStatus('error');
    } 
  };

  const reset = () => {
    setPin("");
    setStatus(null);
    setDetails(null);
  };

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

  return (
    <>
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-6">Claim Page</h1>
      
      {status === null && (
        <div className="space-y-4 max-w-md w-full">
          <input
            type="number"
            value={pin}
            onChange={(e) => setPin(e.target.value.slice(0, 4))}
            className="border p-2 text-center text-xl w-40"
            placeholder="PIN"
          />
          
          {/* Venue Selection Dropdown */}
          <div className="mt-4">
            <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-1">Select Venue</label>
            <select
              id="venue"
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="border p-2 rounded w-full"
              disabled={isLoadingVenues}
              required
            >
              {isLoadingVenues ? (
                <option value="">Loading venues...</option>
              ) : venues.length > 0 ? (
                venues.map(venue => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))
              ) : (
                <option value="">No venues available</option>
              )}
            </select>
          </div>
          
                    <button
            onClick={fetchDetails}
            disabled={pin.length !== 4 || !selectedVenueId}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full mt-4"
          >
            Redeem
          </button>

          <div className="text-center mt-4">
            <button onClick={() => setIsResendModalOpen(true)} className="text-sm text-blue-600 hover:underline">
              Lost your PINs? Resend to your email.
            </button>
          </div>
        </div>
      )}

      {status === "loading" && <p>Loading...</p>}

      {status === "email_verification" && details && (
        <EmailVerification
          pin={details.pin}
          options={details.options}
          onVerified={handleEmailVerified}
          onError={handleEmailError}
        />
      )}

      {status === "confirm" && details && (
        <div className="space-y-4 max-w-sm text-left">
          <p className="text-green-700 text-xl font-semibold text-center">PIN {details.pin_code} accepted</p>
          <p><strong>Guest email:</strong> {details.order?.email}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <p className="text-lg font-medium text-gray-800"><strong>Item:</strong> {details.name}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">Quantity to provide: {details.qty}</p>
          </div>
          
          {/* Venue Selection */}
          <div className="py-2 border-t border-b border-gray-200 my-3">
            <label htmlFor="venue-selection" className="block text-sm font-medium text-gray-700 mb-1">Select venue where this claim is being made</label>
            {isLoadingVenues ? (
              <div className="py-2 text-gray-500">Loading venues...</div>
            ) : venues.length === 0 ? (
              <div className="py-2 text-red-500">No active venues found</div>
            ) : (
              <select
                id="venue-selection"
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                required
              >
                <option value="" disabled>-- Select venue for this claim --</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            )}
            {selectedVenueId && (
              <p className="text-xs text-blue-600 mt-1">Please confirm this venue is correct</p>
            )}
          </div>

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

      {/* Already Claimed Error */}
      {status === "Already claimed" && (
        <div className="space-y-4 max-w-md">
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">PIN Already Claimed</h3>
                <div className="mt-2 text-sm text-orange-700">
                  <p>This PIN has already been redeemed. If you believe this is an error, please contact venue staff for assistance.</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Try Another PIN
          </button>
        </div>
      )}

      {/* PIN Not Found Error */}
      {status === "PIN not found" && (
        <div className="space-y-4 max-w-md">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">PIN Not Found</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>The PIN you entered was not found. Please check your PIN and try again.</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Try Again
          </button>
          <div className="text-center">
            <button onClick={() => setIsResendModalOpen(true)} className="text-sm text-blue-600 hover:underline">
              Lost your PINs? Resend to your email
            </button>
          </div>
        </div>
      )}

      {/* Generic Error */}
      {status && !["loading", "confirm", "saving", "done", "Already claimed", "PIN not found", "email_verification"].includes(status) && (
        <div className="space-y-4 max-w-md">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{status}</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={reset} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">
            Try Again
          </button>
        </div>
      )}
    </main>

      <Transition appear show={isResendModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsResendModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Resend Unclaimed PINs
                  </Dialog.Title>
                  {resendStatus === 'sent' ? (
                    <div className="mt-4 text-center">
                      <p className="text-green-600">If unclaimed PINs for this email exist, they have been resent.</p>
                      <button onClick={() => { setIsResendModalOpen(false); setResendStatus('idle'); }} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Enter the email address you used to purchase. We'll resend the receipt with any PINs that haven't been claimed yet.
                        </p>
                        <input
                          type="email"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="mt-4 w-full border p-2 rounded"
                        />
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                          onClick={handleResend}
                          disabled={resendStatus === 'sending' || !resendEmail}
                        >
                          {resendStatus === 'sending' ? 'Sending...' : 'Send Email'}
                        </button>
                        {resendStatus === 'error' && <p className="text-red-500 text-sm mt-2">Something went wrong. Please try again.</p>}
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
