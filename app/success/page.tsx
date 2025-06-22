export const runtime = "edge";

interface Props {
  searchParams: { session?: string };
}

export default function SuccessPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-4">Thank you for your purchase! 🎉</h1>
      <p className="max-w-lg text-stone-700 mb-6">
        Your order is confirmed.
        Tap <strong>“Show Entry Pass”</strong> below to open your ticket, then <strong>save it as a PDF</strong> or <strong>take a screenshot</strong>.
        Bring the pass to the door. You’ll receive a physical token there to book your experiences, so please arrive 15–20&nbsp;minutes early.
        See you soon at <strong>The Water Bar</strong>!
      </p>
      <div className="flex flex-col space-y-3">
        {searchParams.session && (
          <a
            href={`/receipt/${searchParams.session}`}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-150 ease-in-out text-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            Show Entry Pass
          </a>
        )}
        <a
          href="/"
          className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors duration-150 ease-in-out text-center"
        >
          Return to Homepage
        </a>
      </div>
    </main>
  );
}
