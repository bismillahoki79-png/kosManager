import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KeyRound, Mail, User, Phone, Home } from 'lucide-react'
import Link from 'next/link'

export default async function SignUpPage(
  props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse">
        
        {/* Right Side: Illustration / Brand (Reversed for Sign Up) */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-8">
              <div className="bg-white p-2 rounded-lg">
                <Home className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-2xl font-bold tracking-wide">KosConnect</span>
            </div>
            <h2 className="text-3xl font-extrabold mb-4">
              Mulai Perjalanan Anda
            </h2>
            <p className="text-indigo-100 text-lg">
              Daftar sekarang untuk menemukan kos impian atau kelola properti Anda dengan lebih efisien.
            </p>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <p className="text-sm font-medium">"Aplikasi ini sangat membantu saya dalam mengelola tagihan bulanan!"</p>
              <div className="mt-3 flex items-center">
                <div className="h-8 w-8 rounded-full bg-indigo-300 flex items-center justify-center text-xs font-bold text-indigo-800">BS</div>
                <div className="ml-2 text-xs">
                  <span className="block font-bold">Budi Santoso</span>
                  <span className="block text-indigo-200">Penyewa Happy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract Pattern Background */}
          <div className="absolute bottom-0 right-0 -mb-12 -mr-12 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute top-0 left-0 -mt-12 -ml-12 w-64 h-64 bg-indigo-700 rounded-full opacity-50 blur-3xl"></div>
        </div>

        {/* Left Side: Sign Up Form */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h3>
            <p className="text-gray-500 mt-2">Lengkapi data diri Anda untuk mendaftar.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                  placeholder="Nama Lengkap Anda"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon (WhatsApp)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                  placeholder="081234567890"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              formAction={async (formData) => {
                'use server'
                const email = formData.get('email') as string
                const password = formData.get('password') as string
                const fullName = formData.get('fullName') as string
                const phone = formData.get('phone') as string
                
                const supabase = await createClient()

                const { error } = await supabase.auth.signUp({
                  email,
                  password,
                  options: {
                    data: {
                      full_name: fullName,
                      phone: phone,
                      role: 'tenant' // Default role
                    }
                  }
                })

                if (error) {
                  return redirect(`/sign-up?error=${error.message}`)
                }

                // If email confirmation is disabled, user is signed in automatically.
                // We should redirect to dashboard (middleware will handle routing)
                return redirect('/')
              }}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-6"
            >
              Daftar Sekarang
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
