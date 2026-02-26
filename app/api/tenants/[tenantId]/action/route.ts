import { NextRequest, NextResponse } from "next/server";
import { setReserved, activateTenant, checkOutTenant } from "@/lib/tenant";

import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["reserve", "activate", "checkout"]),
});

export async function POST(req: NextRequest, context: any) {
  try {
    const { action } = actionSchema.parse(await req.json());
    const id = z
      .string()
      .regex(/^[0-9]+$/)
      .transform(Number)
      .parse(context.params.tenantId);
    if (action === "reserve") {
      await setReserved(id);
    } else if (action === "activate") {
      await activateTenant(id);
    } else if (action === "checkout") {
      await checkOutTenant(id);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
