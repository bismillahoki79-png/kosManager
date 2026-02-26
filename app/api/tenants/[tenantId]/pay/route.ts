import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSnapTransaction } from "@/lib/midtrans";

import { z } from "zod";

export async function POST(req: NextRequest, context: any) {
  try {
    const tenantId = z
      .string()
      .regex(/^[0-9]+$/)
      .transform(Number)
      .parse(context.params.tenantId);
    const invoice = await prisma.invoice.findFirst({
      where: { tenantId, status: "UNPAID" },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    if (!invoice) {
      return NextResponse.json({ error: "No unpaid invoice" }, { status: 400 });
    }
    const snap = createSnapTransaction(invoice.id, invoice.amount);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { midtransOrderId: snap.orderId },
    });
    return NextResponse.redirect(snap.redirectUrl);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
