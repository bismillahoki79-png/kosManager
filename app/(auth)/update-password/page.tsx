import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KeyRound, Home } from "lucide-react";

export default async function UpdatePasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
              Pembaruan Password
            </h2>
            <p className="text-indigo-100 text-lg">
              Tulis password baru Anda yang kuat dan mudah diingat.
            </p>
          </div>
          {/* Abstract Pattern Background */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-indigo-700 rounded-full opacity-50 blur-3xl"></div>
        </div>

        {/* Right Side: Update Form */}
        <div className="md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl font-bold text-gray-900">
              Buat Password Baru
            </h3>
            <p className="text-gray-500 mt-2">Kata sandi harus minimal 6 karakter.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">
                {error as string}
              </p>
            </div>
          )}

          <form 
            action={async (formData) => {
              "use server";
              const password = formData.get("password") as string;
              const supabase = await createClient();
              
              const { error } = await supabase.auth.updateUser({
                password,
              });

              if (error) {
                return redirect(`/update-password?error=${encodeURIComponent(error.message)}`);
              }

              // Sign out after updating password to force immediate re-login safely
              await supabase.auth.signOut();
              return redirect("/login?message=" + encodeURIComponent("Password berhasil diubah. Silakan masuk."));
            }}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password Baru
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
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Simpan Password Baru
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
