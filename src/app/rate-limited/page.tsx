import Link from "next/link";

export default function RateLimitedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Too Many Requests
          </h2>
          <p className="mt-4 text-center text-gray-600">
            You have exceeded the rate limit. Please wait a moment and try
            again.
          </p>
        </div>
        <div className="text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
