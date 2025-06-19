'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
    >
      Print or Save as PDF
    </button>
  );
}
