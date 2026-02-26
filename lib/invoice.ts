import { InvoiceType } from "@prisma/client";
import { prisma } from "./prisma";

export async function sendWhatsAppNotification(invoice: any) {
  // placeholder - integrate with external service later
  console.log("sendWhatsAppNotification", invoice.id);
}

export async function generateMonthlyInvoices() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const tenants = await prisma.tenant.findMany({
    include: { room: true },
  });

  for (const tenant of tenants) {
    if (tenant.status === "ACTIVE") {
      // rent invoice
      await prisma.invoice.upsert({
        where: {
          tenantId_month_year_type: {
            tenantId: tenant.id,
            month,
            year,
            type: InvoiceType.RENT,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          roomId: tenant.roomId!,
          month,
          year,
          type: InvoiceType.RENT,
          amount: tenant.room ? tenant.room.monthlyPrice : 0,
          dueDate: new Date(year, month - 1, 10),
        },
      });
    } else if (tenant.status === "RESERVED") {
      await prisma.invoice.upsert({
        where: {
          tenantId_month_year_type: {
            tenantId: tenant.id,
            month,
            year,
            type: InvoiceType.STORAGE,
          },
        },
        update: {},
        create: {
          tenantId: tenant.id,
          roomId: tenant.roomId!,
          month,
          year,
          type: InvoiceType.STORAGE,
          amount: tenant.storagePrice || 0,
          dueDate: new Date(year, month - 1, 10),
        },
      });
    }
  }
}
