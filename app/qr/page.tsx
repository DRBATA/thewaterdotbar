"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import * as QRCodeLib from "qrcode";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QRGeneratorPage() {
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Get current hostname for QR code URL
  const getHostname = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
  };

  // QR code URL with venue ID
  const qrUrl = `${getHostname()}/claim?venue_id=${selectedVenueId}`;

  // Fetch venues from Supabase
  useEffect(() => {
    const fetchVenues = async () => {
      setIsLoading(true);
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
        }
      } catch (err) {
        console.error("Unexpected error fetching venues:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVenues();
  }, []);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate QR code
  const generateQR = async () => {
    if (!selectedVenueId) return;
    
    try {
      // Generate QR code as data URL
      const dataUrl = await QRCodeLib.toDataURL(qrUrl, {
        width: 250,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
      
      setQrDataUrl(dataUrl);
      setQrGenerated(true);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // Download QR code as PNG
  const downloadQR = () => {
    if (!qrDataUrl) return;
    
    // Find selected venue name
    const venueName = venues.find(v => v.id === selectedVenueId)?.name || 'venue';
    const safeVenueName = venueName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.download = `water_bar_qr_${safeVenueName}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-center">Venue QR Code Generator</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="venue-select">
            Select Venue
          </label>
          {isLoading ? (
            <div className="py-2 text-gray-500">Loading venues...</div>
          ) : (
            <select
              id="venue-select"
              value={selectedVenueId}
              onChange={(e) => {
                setSelectedVenueId(e.target.value);
                setQrGenerated(false);
              }}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="" disabled>-- Select a venue --</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={generateQR}
            disabled={!selectedVenueId}
            className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50 mr-2"
          >
            Generate QR Code
          </button>
        </div>

        {qrGenerated && selectedVenueId && qrDataUrl && (
          <div className="mt-8 flex flex-col items-center" ref={qrRef}>
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
              <img 
                src={qrDataUrl} 
                alt={`QR Code for ${venues.find(v => v.id === selectedVenueId)?.name || 'venue'}`}
                width={250}
                height={250}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Scan to redeem at {venues.find(v => v.id === selectedVenueId)?.name}
            </p>
            <button
              onClick={downloadQR}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Download QR Code
            </button>
            <div className="mt-4 bg-gray-100 p-3 rounded text-xs font-mono break-all">
              {qrUrl}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
