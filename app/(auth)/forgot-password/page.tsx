import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Mail, Home } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;
  const message = searchParams?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Illustration / Brand */}
        <div className="md:w-1/2 bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-8">
              <div className="bg-white p-2 rounded-lg">
                <Home className="h-6 w-6 text-indigo-600" />
              </div>
              <span className="text-2xl font-bold tracking-wide">
                KosConnect
              </span>
            </div>
            <h2 className="text-3xl font-extrabold mb-4">
              Lupa Password?
            </h2>
            <p className="text-indigo-100 text-lg">
              Jangan khawatir. Masukkan email Anda yang terdaftar, dan kami akan mengirimkan tautan untuk membuat password baru.
            </p>
          </div>
          {/* Abstract Pattern Background */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-700 rounded-full opacity-50 blur-3xl"></div>
        </div>

        {/* Right Side: Reset Form */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900">
              Reset Password
            </h3>
            <p className="text-gray-500 mt-2">Masukkan email Anda untuk menerima tautan.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">
                {error as string}
              </p>
            </div>
          )}

          {message && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
              <p className="text-sm text-green-700">
                {message as string}
              </p>
            </div>
          )}

          <form 
            action={async (formData) => {
              "use server";
              const email = formData.get("email") as string;
              const supabase = await createClient();
              const RequestHeaders = await headers();
              const origin = RequestHeaders.get("origin") || "http://localhost:3000";
              
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/auth/callback?next=/update-password`,
              });

              if (error) {
                return redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
              }

              return redirect("/forgot-password?message=Tautan reset password telah dikirim ke email Anda.");
            }}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
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

            <button
              type="submit"
              className="w-full cursor-pointer flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Kirim Tautan Reset
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Kenal kembali password Anda?{" "}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Masuk ke Akun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
