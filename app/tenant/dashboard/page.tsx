import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoiceHistory from "@/components/tenant/InvoiceHistory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Home, CreditCard, LogOut } from "lucide-react";

export default async function TenantDashboard() {
  const supabase = await createClient();

  // Redirect if not logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch tenant lease info
  const { data: lease } = await supabase
    .from("leases")
    .select("*, rooms(name)")
    .eq("tenant_id", user.id)
    .is("end_date", null)
    .single();

  // Fetch invoices for this tenant
  let invoices: any[] = [];
  if (lease) {
    const { data } = await supabase
      .from("invoices")
      .select("*, lease:leases(room:rooms(name))")
      .eq("lease_id", lease.id)
      .order("created_at", { ascending: false });
    invoices = data || [];
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Dashboard Penyewa
            </h1>
            <p className="text-slate-500 mt-2 text-lg">Pantau informasi kamar dan riwayat tagihan Anda dengan mudah.</p>
          </div>
          <form 
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/login");
            }}
          >
            <Button type="submit" variant="outline" className="text-slate-700 hover:text-white hover:bg-destructive border-slate-300 w-full sm:w-auto transition-all shadow-sm">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar Akun
            </Button>
          </form>
        </div>

        {/* Room Info Section */}
        <Card className="shadow-md border-slate-200 bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-5">
            <CardTitle className="text-xl font-bold flex items-center text-slate-800">
              <Home className="mr-3 h-6 w-6 text-indigo-600" />
              Informasi Kamar
            </CardTitle>
            <CardDescription className="text-sm">Detail penyewaan kamar Anda saat ini</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {lease ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nomor Kamar</p>
                  <p className="text-2xl font-bold text-slate-900">{lease.rooms?.name}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tanggal Serah Terima</p>
                  <p className="text-lg font-semibold flex items-center text-slate-800">
                    <CalendarDays className="mr-2 h-5 w-5 text-indigo-500" />
                    {new Date(lease.start_date).toLocaleDateString("id-ID", {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Siklus Pembayaran</p>
                  <p className="text-lg font-semibold text-slate-800">Per {lease.billing_cycle} bulan</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Biaya Sewa Bersih</p>
                  <p className="text-xl font-bold flex items-center text-indigo-700">
                    <CreditCard className="mr-2 h-5 w-5 text-indigo-500" />
                    Rp {lease.custom_price.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Home className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-800 text-lg font-bold">
                  Belum Ada Kamar Aktif
                </p>
                <p className="text-base text-slate-500 mt-2 max-w-sm">
                  Anda belum terdaftar atau ditempatkan di kamar manapun. Silakan hubungi pemilik kos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice History Section */}
        <div className="pt-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Tagihan Anda</h2>
          </div>
          {lease ? (
            <InvoiceHistory invoices={invoices} />
          ) : (
            <Card className="shadow-sm border-slate-200 bg-slate-50 opacity-80">
              <CardContent className="flex justify-center py-10">
                <p className="text-slate-500 font-medium">Data tagihan tidak tersedia. Tagihan baru akan muncul setelah Anda menempati kamar.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
