import { TenantStatus, RoomStatus } from "@prisma/client";
import { prisma } from "./prisma";

export async function setReserved(tenantId: number) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");
  if (tenant.status === "RESERVED") return;

  if (tenant.roomId) {
    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: "RESERVED" },
      });
      await tx.room.update({
        where: { id: tenant.roomId! },
        data: { status: "RESERVED" },
      });
    });
  }
}

export async function activateTenant(tenantId: number) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");
  if (tenant.status === "ACTIVE") return;

  if (tenant.roomId) {
    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: tenantId },
        data: { status: "ACTIVE" },
      });
      await tx.room.update({
        where: { id: tenant.roomId! },
        data: { status: "OCCUPIED" },
      });
    });
  }
}

export async function checkOutTenant(tenantId: number) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Tenant not found");

  await prisma.$transaction(async (tx) => {
    await tx.tenant.update({
      where: { id: tenantId },
      data: { status: "CHECKED_OUT", roomId: null },
    });
    if (tenant.roomId) {
      await tx.room.update({
        where: { id: tenant.roomId },
        data: { status: "AVAILABLE", currentTenantId: null },
      });
    }
  });
}
