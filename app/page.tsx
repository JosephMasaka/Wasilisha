import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary-900 mb-4">
            Wasilisha
          </h1>
          <p className="text-xl text-primary-700 mb-8">
            Reach Every Channel. One Platform.
          </p>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
            Send bulk SMS, email, and WhatsApp messages through one unified dashboard.
            One wallet, one set of contacts, one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/auth/signin"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Bulk SMS</h3>
            <p className="text-gray-600">
              Reach your customers via SMS with Kenya-optimized routing through Africa&apos;s Talking
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">✉️</div>
            <h3 className="text-xl font-semibold mb-2">Email Campaigns</h3>
            <p className="text-gray-600">
              Send professional email campaigns with tracking and analytics
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">WhatsApp Business</h3>
            <p className="text-gray-600">
              Connect with customers on WhatsApp using Meta&apos;s Business API
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
