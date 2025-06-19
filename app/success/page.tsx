export const runtime = "edge";

interface Props {
  searchParams: { session?: string };
}

export default function SuccessPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-semibold mb-4">Thank you for your purchase! 🎉</h1>
      <p className="max-w-md text-stone-700">
        We&#39;ve received your order and sent a confirmation email. Feel free to browse more items or
        close this window. See you soon at The Water Bar!
      </p>
      {searchParams.session && (
        <a
          href={`/receipt/${sessionId}`}
          className="text-indigo-600 hover:text-indigo-500 font-semibold"
          target="_blank"
          rel="noopener noreferrer"
        >
          View your receipt
        </a>
      )}
    </main>
  );
}
