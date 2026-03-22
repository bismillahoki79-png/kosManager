"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import DraggableTenant from "./DraggableTenant";
import DroppableRoom from "./DroppableRoom";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Users } from "lucide-react";

type Tenant = {
  id: string;
  full_name: string | null;
  email: string;
};

type Room = {
  id: string;
  name: string;
  status: "Available" | "Occupied" | "Storage";
  base_price: number;
  max_tenants?: number;
};

interface Props {
  initialRooms: Room[];
  initialUnassignedTenants: Tenant[];
  initialRoomTenants: Record<string, Tenant[]>;
  activeLeases: any[];
}

export default function RoomManagement({
  initialRooms,
  initialUnassignedTenants,
  initialRoomTenants,
  activeLeases,
}: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [unassignedTenants, setUnassignedTenants] = useState<Tenant[]>(
    initialUnassignedTenants,
  );
  const [roomTenants, setRoomTenants] =
    useState<Record<string, Tenant[]>>(initialRoomTenants);
  const [leases, setLeases] = useState<any[]>(activeLeases);

  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);

  // Modals
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: "", max_tenants: 1 });
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  const [assignmentConfig, setAssignmentConfig] = useState<{
    tenant: Tenant;
    room: Room;
    oldRoomId?: string;
  } | null>(null);
  const [leaseParams, setLeaseParams] = useState({
    custom_price: "",
    billing_cycle: "1",
    payment_date: "1",
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const [checkoutConfig, setCheckoutConfig] = useState<{
    tenant: Tenant;
    roomId: string;
  } | null>(null);
  const [checkoutDate, setCheckoutDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const tenantId = active.id as string;

    // Check if dragging from unassigned
    let tenant = unassignedTenants.find((t) => t.id === tenantId);

    // Check if dragging from a room
    if (!tenant) {
      for (const [_, tenantsArr] of Object.entries(roomTenants)) {
        const found = tenantsArr.find((t) => t.id === tenantId);
        if (found) {
          tenant = found;
          break;
        }
      }
    }

    if (tenant) {
      setActiveTenant(tenant);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTenant(null);
    if (!over) return;

    const tenantId = active.id as string;
    const targetId = over.id as string;

    // Find where the tenant is currently from
    const isFromUnassigned = unassignedTenants.some((t) => t.id === tenantId);
    let oldRoomId: string | undefined = undefined;
    let tenantObj: Tenant | undefined = unassignedTenants.find(
      (t) => t.id === tenantId,
    );

    if (!isFromUnassigned) {
      for (const [rId, tenantsArr] of Object.entries(roomTenants)) {
        if (tenantsArr.some((t) => t.id === tenantId)) {
          oldRoomId = rId;
          tenantObj = tenantsArr.find((t) => t.id === tenantId);
          break;
        }
      }
    }

    if (!tenantObj) return;

    // Checkout / unassign tenant
    if (targetId === "unassigned" && oldRoomId) {
      const today = new Date().toISOString().split("T")[0];
      const oldRoom = rooms.find((r) => r.id === oldRoomId);

      // Mark lease ended
      const endingLease = leases.find(
        (l) =>
          l.tenant_id === tenantId && l.room_id === oldRoomId && !l.end_date,
      );
      if (endingLease) {
        const { error: endLeaseError } = await supabase
          .from("leases")
          .update({ end_date: today })
          .eq("id", endingLease.id);
        if (endLeaseError) {
          toast.error("Gagal mengakhiri sewa: " + endLeaseError.message);
          return;
        }
      }

      await supabase.from("room_history").insert({
        room_id: oldRoomId,
        tenant_id: tenantId,
        action: "Checkout",
        notes: `${tenantObj.full_name || tenantObj.email} keluar dari kamar ${oldRoom?.name || oldRoomId}`,
      });

      setUnassignedTenants((prev) => [...prev, tenantObj!]);
      setRoomTenants((prev) => {
        const updatedOld = (prev[oldRoomId] || []).filter(
          (t) => t.id !== tenantId,
        );
        return { ...prev, [oldRoomId]: updatedOld };
      });

      if (oldRoom && oldRoom.status === "Occupied") {
        const oldCount = (roomTenants[oldRoomId]?.length || 1) - 1;
        if (oldCount < (oldRoom.max_tenants || 1)) {
          setRooms((prev) =>
            prev.map((r) =>
              r.id === oldRoomId ? { ...r, status: "Available" } : r,
            ),
          );
          await supabase
            .from("rooms")
            .update({ status: "Available" })
            .eq("id", oldRoomId);
        }
      }

      setLeases((prev) =>
        prev.map((l) =>
          l.id === endingLease?.id ? { ...l, end_date: today } : l,
        ),
      );

      toast.success("Penyewa sudah keluar dari kamar", {
        description: `${tenantObj.full_name || tenantObj.email} sekarang sudah berada di daftar penyewa.`,
      });
      return;
    }

    const targetRoom = rooms.find((r) => r.id === targetId);
    if (!targetRoom) return;
    if (oldRoomId === targetId) return;

    const currentTenantsCount = roomTenants[targetId]?.length || 0;

    if (currentTenantsCount < (targetRoom.max_tenants || 1)) {
      setLeaseParams({
        custom_price:
          targetRoom.base_price > 0 ? targetRoom.base_price.toString() : "",
        billing_cycle: "1",
        payment_date: new Date().getDate().toString(),
      });
      setAssignmentConfig({ tenant: tenantObj, room: targetRoom, oldRoomId });
    } else {
      toast.warning("Kamar Penuh", {
        description: "Kamar ini sudah mencapai batas maksimal penyewa.",
      });
    }
  };

  const confirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentConfig) return;

    const { tenant, room, oldRoomId } = assignmentConfig;
    setIsAssigning(true);

    try {
      const customPrice =
        parseInt(leaseParams.custom_price.replace(/\D/g, "")) || 0;
      const billingCycle = parseInt(leaseParams.billing_cycle) || 1;
      const paymentDate = parseInt(leaseParams.payment_date) || 1;
      const today = new Date().toISOString().split("T")[0];

      // If relocating, terminate old lease
      if (oldRoomId) {
        const oldLease = leases.find(
          (l) =>
            l.tenant_id === tenant.id && l.room_id === oldRoomId && !l.end_date,
        );
        if (oldLease) {
          const { error: endLeaseError } = await supabase
            .from("leases")
            .update({
              end_date: today,
            })
            .eq("id", oldLease.id);
          if (endLeaseError) throw endLeaseError;
        }

        // Add move-out history for old room
        await supabase.from("room_history").insert({
          room_id: oldRoomId,
          tenant_id: tenant.id,
          action: "Moved Out",
          notes: `Pindah ke kamar ${room.name}`,
        });
      }

      // 1. Create a new lease for the target room
      const { data: newLeaseData, error: leaseError } = await supabase
        .from("leases")
        .insert({
          tenant_id: tenant.id,
          room_id: room.id,
          start_date: today,
          billing_cycle: billingCycle,
          custom_price: customPrice,
          payment_date: paymentDate,
        })
        .select()
        .single();

      if (leaseError) {
        if (leaseError.message.includes('column "payment_date"')) {
          toast.error(
            "Kolom payment_date belum ada di database Anda! Pastikan Anda sudah menjalankan SQL ALTER TABLE.",
          );
          throw leaseError;
        }
        throw leaseError;
      }

      // 2. Add move-in history
      await supabase.from("room_history").insert({
        room_id: room.id,
        tenant_id: tenant.id,
        action: oldRoomId ? "Relocated" : "Moved In",
        notes: `Biaya: Rp ${customPrice.toLocaleString("id-ID")} / ${billingCycle} bln (Jatuh tempo tgl ${paymentDate})`,
      });

      // 3. Update Target room status if full
      const newTargetCount = (roomTenants[room.id]?.length || 0) + 1;
      if (newTargetCount >= (room.max_tenants || 1)) {
        await supabase
          .from("rooms")
          .update({ status: "Occupied" })
          .eq("id", room.id);
      }

      // 4. Update Old room status to Available if it was Occupied
      if (oldRoomId) {
        const oldRoomCount = (roomTenants[oldRoomId]?.length || 0) - 1;
        const oldRoomMeta = rooms.find((r) => r.id === oldRoomId);
        if (oldRoomCount < (oldRoomMeta?.max_tenants || 1)) {
          await supabase
            .from("rooms")
            .update({ status: "Available" })
            .eq("id", oldRoomId);
        }
      }

      // 5. UPDATE LOCAL UI STATE
      setLeases((prev) => {
        const newArr = prev.map((l) =>
          l.tenant_id === tenant.id && l.room_id === oldRoomId
            ? { ...l, end_date: today }
            : l,
        );
        return [...newArr, newLeaseData];
      });

      if (oldRoomId) {
        setRoomTenants((prev) => {
          const updatedOld = prev[oldRoomId].filter((t) => t.id !== tenant.id);
          const existingTarget = prev[room.id] || [];
          return {
            ...prev,
            [oldRoomId]: updatedOld,
            [room.id]: [...existingTarget, tenant],
          };
        });
      } else {
        setUnassignedTenants((prev) => prev.filter((t) => t.id !== tenant.id));
        setRoomTenants((prev) => {
          const existing = prev[room.id] || [];
          return { ...prev, [room.id]: [...existing, tenant] };
        });
      }

      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === room.id && newTargetCount >= (r.max_tenants || 1))
            return { ...r, status: "Occupied" };
          if (r.id === oldRoomId) {
            const count = (roomTenants[oldRoomId]?.length || 0) - 1;
            if (count < (r.max_tenants || 1))
              return { ...r, status: "Available" };
          }
          return r;
        }),
      );

      toast.success(oldRoomId ? `Perpindahan Sukses` : `Penempatan Sukses`, {
        description: `${tenant.full_name || tenant.email} resmi masuk kamar ${room.name}.`,
      });
      setAssignmentConfig(null);
    } catch (error: any) {
      console.error("Error assigning tenant:", error);
      toast.error("Gagal menempatkan penyewa: " + error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const openCheckoutModal = (tenant: Tenant, roomId: string) => {
    setCheckoutConfig({ tenant, roomId });
    setCheckoutDate(new Date().toISOString().split("T")[0]);
  };

  const performCheckout = async (date: string) => {
    if (!checkoutConfig) return;
    setIsCheckingOut(true);

    try {
      const { data: existingLeases, error: leaseFetchError } = await supabase
        .from("leases")
        .select("*")
        .eq("tenant_id", checkoutConfig.tenant.id)
        .eq("room_id", checkoutConfig.roomId)
        .is("end_date", null)
        .order("start_date", { ascending: false })
        .limit(1);

      if (leaseFetchError) throw leaseFetchError;
      if (!existingLeases || existingLeases.length === 0) {
        throw new Error("Lease aktif tidak ditemukan untuk penyewa ini.");
      }

      const leaseToClose = existingLeases[0];
      const { error: endLeaseError } = await supabase
        .from("leases")
        .update({ end_date: date })
        .eq("id", leaseToClose.id);

      if (endLeaseError) throw endLeaseError;

      await supabase.from("room_history").insert({
        room_id: checkoutConfig.roomId,
        tenant_id: checkoutConfig.tenant.id,
        action: "Checkout",
        notes: `Keluar pada ${date}`,
      });

      const room = rooms.find((r) => r.id === checkoutConfig.roomId);
      const updatedRoomTenants = (
        roomTenants[checkoutConfig.roomId] || []
      ).filter((t) => t.id !== checkoutConfig.tenant.id);

      if (room && updatedRoomTenants.length < (room.max_tenants || 1)) {
        await supabase
          .from("rooms")
          .update({ status: "Available" })
          .eq("id", room.id);
      }

      setUnassignedTenants((prev) => [...prev, checkoutConfig.tenant]);
      setRoomTenants((prev) => ({
        ...prev,
        [checkoutConfig.roomId]: updatedRoomTenants,
      }));
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === checkoutConfig.roomId) {
            if (updatedRoomTenants.length < (r.max_tenants || 1)) {
              return { ...r, status: "Available" };
            }
          }
          return r;
        }),
      );
      setLeases((prev) =>
        prev.map((l) =>
          l.id === leaseToClose.id ? { ...l, end_date: date } : l,
        ),
      );

      toast.success("Penyewa berhasil dikeluarkan", {
        description: `${checkoutConfig.tenant.full_name || checkoutConfig.tenant.email} keluar dari kamar.`,
      });

      setCheckoutConfig(null);
    } catch (err: any) {
      console.error("Error checkout tenant:", err);
      toast.error("Gagal checkout: " + (err?.message || "Terjadi kesalahan"));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performCheckout(checkoutDate);
  };

  const leaveNow = async () => {
    await performCheckout(new Date().toISOString().split("T")[0]);
  };

  const handleAddRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalMaxTenants = newRoomData.max_tenants === "" ? 1 : Number(newRoomData.max_tenants);
    setIsAddingRoom(true);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          name: newRoomData.name,
          max_tenants: finalMaxTenants,
          base_price: 0,
          status: "Available",
        })
        .select()
        .single();

      if (error) throw error;

      setRooms([data, ...rooms]);
      toast.success("Kamar Baru Dibuat", {
        description: `Kamar ${data.name} siap digunakan.`,
      });
      setIsAddRoomOpen(false);
      setNewRoomData({ name: "", max_tenants: ""});
    } catch (error: any) {
      toast.error("Gagal membuat kamar: " + error.message);
    } finally {
      setIsAddingRoom(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsAddRoomOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kamar
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Daftar Penyewa (Unassigned) */}
          <Card className="col-span-1 shadow-md border-slate-200 bg-white transition-all">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" />
                Daftar Penyewa
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {unassignedTenants.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Tidak ada penyewa. (tidak ada penyewa lainnya mungkin)
                  </p>
                ) : (
                  unassignedTenants.map((tenant) => (
                    <DraggableTenant key={tenant.id} tenant={tenant} />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rooms Grid */}
          <div className="col-span-1 md:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rooms.map((room) => (
                <DroppableRoom
                  key={room.id}
                  room={room}
                  tenants={roomTenants[room.id] || []}
                  onCheckoutTenant={openCheckoutModal}
                />
              ))}
              {rooms.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                  <p className="text-slate-500 font-medium">
                    Belum ada kamar yang terdaftar.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsAddRoomOpen(true)}
                  >
                    Tambah Kamar Pertama
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeTenant ? (
            <Card className="opacity-95 shadow-xl cursor-grabbing border-indigo-500 ring-4 ring-indigo-500/20 bg-white scale-105">
              <CardContent className="p-3 flex items-center space-x-3">
                <div className="shrink-0 h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {(activeTenant.full_name || activeTenant.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {activeTenant.full_name || "Tanpa Nama"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>

        {/* Checkout Tenant Modal */}
        <Dialog
          open={!!checkoutConfig}
          onOpenChange={(open) => !open && setCheckoutConfig(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Checkout Penyewa</DialogTitle>
              <DialogDescription>
                Pilih tanggal checkout untuk{" "}
                <b>
                  {checkoutConfig?.tenant.full_name ||
                    checkoutConfig?.tenant.email}
                </b>
                .
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="checkout_date">Tanggal Checkout</Label>
                <Input
                  id="checkout_date"
                  type="date"
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCheckoutConfig(null)}
                >
                  Batal
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={leaveNow}
                    disabled={isCheckingOut}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Keluar Sekarang
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCheckingOut}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Simpan Tanggal
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DndContext>

      {/* Add Room Dialog */}
      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Kamar Baru</DialogTitle>
            <DialogDescription>
              Tambahkan detail kamar ke dalam sistem.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddRoomSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Kamar (Nomor / Identitas)</Label>
              <Input
                id="name"
                placeholder="Contoh: Kamar 101"
                required
                value={newRoomData.name}
                onChange={(e) =>
                  setNewRoomData({ ...newRoomData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tenants">Maksimal Penyewa di Kamar Ini</Label>
              <Input
                id="max_tenants"
                type="number"
                min="1"
                required
                value={newRoomData.max_tenants}
                onChange={(e) =>
                  setNewRoomData({
                    ...newRoomData,
                    max_tenants: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddRoomOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isAddingRoom}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isAddingRoom && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Simpan Kamar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Tenant Lease Settings Dialog */}
      <Dialog
        open={!!assignmentConfig}
        onOpenChange={(open) => !open && setAssignmentConfig(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {assignmentConfig?.oldRoomId
                ? "Pindah Kamar (Atur Ulang Sewa)"
                : "Atur Nilai Sewa"}
            </DialogTitle>
            <DialogDescription>
              Menempatkan <b>{assignmentConfig?.tenant.full_name}</b> di{" "}
              <b>{assignmentConfig?.room.name}</b>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={confirmAssignment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom_price">Harga Sewa Bersih (Rp)</Label>
              <Input
                id="custom_price"
                type="text"
                placeholder="Contoh: 1500000"
                required
                value={leaseParams.custom_price}
                onChange={(e) =>
                  setLeaseParams({
                    ...leaseParams,
                    custom_price: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Siklus Pembayaran</Label>
                <div className="relative">
                  <Input
                    id="billing_cycle"
                    type="number"
                    min="1"
                    required
                    value={leaseParams.billing_cycle}
                    onChange={(e) =>
                      setLeaseParams({
                        ...leaseParams,
                        billing_cycle: e.target.value,
                      })
                    }
                    className="pr-14"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-500">
                    Bulan
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Tanggal Penagihan</Label>
                <Input
                  id="payment_date"
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={leaseParams.payment_date}
                  onChange={(e) =>
                    setLeaseParams({
                      ...leaseParams,
                      payment_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1 border-t border-slate-100 italic">
              * Invoice tagihan akan jatuh tempo setiap tanggal{" "}
              <b>{leaseParams.payment_date || "X"}</b> per berjalan{" "}
              <b>{leaseParams.billing_cycle || "Y"}</b> bulan.
            </p>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignmentConfig(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isAssigning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isAssigning && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Konfirmasi Penempatan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
