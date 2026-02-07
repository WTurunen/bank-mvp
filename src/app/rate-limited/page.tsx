export default function RateLimitedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Too Many Requests
          </h2>
          <p className="mt-4 text-gray-600">
            You&apos;ve made too many requests. Please wait a moment and try again.
          </p>
        </div>
        <a
          href="/"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
