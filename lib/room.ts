import { prisma } from "./prisma";

export async function moveTenant(tenantId: number, targetRoomId: number) {
  // optimistic update logic handled in UI; backend verifies and updates
  const targetRoom = await prisma.room.findUnique({
    where: { id: targetRoomId },
  });
  if (!targetRoom || targetRoom.status !== "AVAILABLE") {
    throw new Error("Target room not available");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  const prevRoomId = tenant.roomId;

  await prisma.$transaction(async (tx: any) => {
    if (prevRoomId) {
      await tx.room.update({
        where: { id: prevRoomId },
        data: { status: "AVAILABLE" },
      });
    }
    await tx.room.update({
      where: { id: targetRoomId },
      data: { status: "OCCUPIED" },
    });
    await tx.tenant.update({
      where: { id: tenantId },
      data: { roomId: targetRoomId },
    });

    // update currentTenant fields
    if (prevRoomId) {
      await tx.room.update({
        where: { id: prevRoomId },
        data: { currentTenantId: null },
      });
    }
    await tx.room.update({
      where: { id: targetRoomId },
      data: { currentTenantId: tenantId },
    });
  });
}
