'use client';

export default function PrintButton() {
  const buttonStyles = "w-64 px-6 py-3 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors";

  return (
    <button
      onClick={() => window.print()}
      className={`${buttonStyles} bg-gray-600 hover:bg-gray-700 focus:ring-gray-500`}
    >
      Print or Save as PDF
    </button>
  );
}
