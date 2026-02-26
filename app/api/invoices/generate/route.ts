import { NextResponse } from "next/server";
import { generateMonthlyInvoices } from "@/lib/invoice";

export async function GET() {
  try {
    await generateMonthlyInvoices();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
