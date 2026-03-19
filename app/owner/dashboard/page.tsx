import { createClient } from "@/lib/supabase/server";
import RoomManagement from "@/components/owner/RoomManagement";
import CreateInvoiceForm from "@/components/owner/CreateInvoiceForm";
import InvoiceList from "@/components/owner/InvoiceList";
import { redirect } from "next/navigation";

export default async function OwnerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch rooms
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

  // 5. Create map for RoomManagement
  const roomTenantsMap: Record<string, any> = {};
  activeLeases?.forEach((lease) => {
    const tenant = allTenants?.find((t) => t.id === lease.tenant_id);
    if (tenant) {
      roomTenantsMap[lease.room_id] = tenant;
    }
  });

  // 6. Prepare data for CreateInvoiceForm (Tenants with active leases)
  const tenantsWithLeases =
    allTenants
      ?.filter((t) => activeTenantIds.includes(t.id))
      .map((t) => {
        const userLeases = activeLeases
          ?.filter((l) => l.tenant_id === t.id)
          .map((l) => ({
            id: l.id,
            room: { name: l.room.name },
          }));
        return { ...t, leases: userLeases || [] };
      }) || [];

  // 7. Fetch Invoices
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, lease:leases(tenant:profiles(full_name), room:rooms(name))")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Owner</h1>
          <form action="/auth/sign-out" method="post">
            <button className="text-sm font-medium text-red-600 hover:text-red-500 bg-white px-4 py-2 rounded border border-red-200">
              Keluar
            </button>
          </form>
        </div>

        {/* Room Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">
            Manajemen Kamar (Drag & Drop)
          </h2>
          <RoomManagement
            initialRooms={rooms || []}
            initialUnassignedTenants={unassignedTenants}
            initialRoomTenants={roomTenantsMap}
          />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Invoice Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <h2 className="text-xl font-semibold mb-6">Buat Tagihan Baru</h2>
              <CreateInvoiceForm tenants={tenantsWithLeases} />
            </div>
          </div>

          {/* Invoice List & Verification Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <h2 className="text-xl font-semibold mb-6">
                Daftar Tagihan & Verifikasi
              </h2>
              <InvoiceList invoices={(invoices as any) || []} />
            </div>
          </div>
      </div>
    </div>
  );
}
