import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          {/* Header */}
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Kos Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            Kelola kamar kos, tenant, dan pembayaran dengan mudah dan efisien
          </p>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🏠</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Manajemen Kamar
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Kelola status kamar, harga, dan tenant secara real-time
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Data Tenant
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Catat dan pantau informasi tenant dengan lengkap
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Pembayaran
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Terima pembayaran dan kelola tagihan dengan aman
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/rooms"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Kelola Kamar
            </Link>
            <Link
              href="/tenants"
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Data Tenant
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-16 text-gray-600 dark:text-gray-400 text-sm">
            <p>Kos Management System v1.0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
