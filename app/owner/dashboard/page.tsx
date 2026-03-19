import { createClient } from "@/lib/supabase/server";
import RoomManagement from "@/components/owner/RoomManagement";
import InvoiceList from "@/components/owner/InvoiceList";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function OwnerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  // 1. Fetch rooms (including max_tenants)
  const { data: rooms } = await supabase
    .from("rooms")
    .select("*")
    .order("name", { ascending: true });

  // 2. Fetch all tenants
  const { data: allTenants } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "tenant");

  // 3. Fetch active leases
  const { data: activeLeases } = await supabase
    .from("leases")
    .select("*, room:rooms(name)")
    .is("end_date", null);

  // 4. Determine unassigned tenants
  const activeTenantIds = activeLeases?.map((l) => l.tenant_id) || [];
  const unassignedTenants =
    allTenants?.filter((t) => !activeTenantIds.includes(t.id)) || [];

  // 5. Create multi-tenant map for RoomManagement
  const roomTenantsMap: Record<string, any[]> = {};
  activeLeases?.forEach((lease) => {
    const tenant = allTenants?.find((t) => t.id === lease.tenant_id);
    if (tenant) {
      if (!roomTenantsMap[lease.room_id]) {
        roomTenantsMap[lease.room_id] = [];
      }
      roomTenantsMap[lease.room_id].push(tenant);
    }
  });

  // 6. Fetch Invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, lease:leases(tenant:profiles(full_name), room:rooms(name))")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dashboard Owner</h1>
            <p className="text-slate-500 mt-2 text-lg">Kelola kamar, penyewa, dan tagihan dengan efisien.</p>
          </div>
          <div className="flex gap-3">
            <a href="/owner/logs">
              <Button variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 w-full sm:w-auto shadow-sm">
                Riwayat Aktivitas
              </Button>
            </a>
            <form 
              action={async () => {
                "use server";
                const supabase = await createClient();
                await supabase.auth.signOut();
                redirect("/login");
              }}
            >
              <Button type="submit" variant="outline" className="text-destructive hover:text-white hover:bg-destructive border-destructive/20 w-full sm:w-auto transition-colors shadow-sm">
                Keluar Akun
              </Button>
            </form>
          </div>
        </div>

        {/* Room Management Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Kamar & Penyewa</h2>
            <p className="text-sm text-slate-500 mt-1">Atur kapasitas kamar dan seret penyewa antar kamar secara dinamis.</p>
          </div>
          <RoomManagement
            initialRooms={rooms || []}
            initialUnassignedTenants={unassignedTenants}
            initialRoomTenants={roomTenantsMap}
            activeLeases={activeLeases || []}
          />
        </section>

        {/* Billing Section */}
        <section className="pt-6 border-t border-slate-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Status Tagihan Berjalan</h2>
            <p className="text-sm text-slate-500 mt-1">Verifikasi pembayaran masuk dari seluruh penyewa.</p>
          </div>
          <InvoiceList invoices={(invoices as any) || []} />
        </section>
      </div>
    </div>
  );
}
