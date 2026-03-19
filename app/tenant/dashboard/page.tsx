import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvoiceHistory from "@/components/tenant/InvoiceHistory";

export default async function TenantDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard Penyewa
          </h1>
          <form action="/auth/sign-out" method="post">
            <button className="text-sm font-medium text-red-600 hover:text-red-500 bg-white px-4 py-2 rounded border border-red-200">
              Keluar
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informasi Kamar</h2>
          {lease ? (
            <div className="space-y-2">
              <p>
                <span className="text-gray-500">Kamar:</span>{" "}
                <span className="font-medium">{lease.rooms?.name}</span>
              </p>
              <p>
                <span className="text-gray-500">Mulai Sewa:</span>{" "}
                <span className="font-medium">
                  {new Date(lease.start_date).toLocaleDateString("id-ID")}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Siklus Tagihan:</span>{" "}
                <span className="font-medium">
                  Tiap {lease.billing_cycle} bulan
                </span>
              </p>
              <p>
                <span className="text-gray-500">Biaya Sewa:</span>{" "}
                <span className="font-medium">
                  Rp {lease.custom_price.toLocaleString("id-ID")}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-gray-500 italic">
              Anda belum ditempatkan di kamar manapun.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Riwayat Tagihan</h2>
          {lease ? (
            <InvoiceHistory invoices={invoices} />
          ) : (
            <p className="text-gray-500 italic">Belum ada tagihan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
