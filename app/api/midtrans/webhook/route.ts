import { NextRequest, NextResponse } from "next/server";
import { validateSignature } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signature = req.headers.get("x-midtrans-signature") || "";
    const key = process.env.MIDTRANS_SERVER_KEY || "";

    if (!validateSignature(key, JSON.stringify(body), signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { order_id, transaction_status, gross_amount } = body;
    if (
      transaction_status === "capture" ||
      transaction_status === "settlement"
    ) {
      const invoice = await prisma.invoice.findFirst({
        where: { midtransOrderId: order_id },
      });
      if (invoice && invoice.status !== "PAID") {
        await prisma.$transaction(async (tx: any) => {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "PAID", paidAt: new Date() },
          });
          await tx.payment.create({
            data: {
              invoiceId: invoice.id,
              midtransTransactionId: body.transaction_id,
              amount: invoice.amount,
              status: transaction_status,
              paidAt: new Date(),
            },
          });
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
