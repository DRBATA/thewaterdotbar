export const runtime = "edge";

interface Props {
  searchParams: { session?: string };
}

export default function SuccessPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-4">Thank you for your purchase! 🎉</h1>
      <p className="max-w-lg text-stone-700 mb-6">
        Your order is confirmed! Click below to view your receipt, which contains the PIN codes you'll need to claim your items at any Water Bar venue. 
        <br /><br />
        <strong>Need directions?</strong> You can find venue locations and get directions from our menu, or switch on live GPS to find the nearest venue to you.
      </p>
      <div className="flex flex-col space-y-3">
        {searchParams.session && (
          <a
            href={`/receipt/${searchParams.session}`}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-150 ease-in-out text-center"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Your Receipt & PINs
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
