import { NextRequest, NextResponse } from "next/server";
import { moveTenant } from "@/lib/room";

import { z } from "zod";

const moveSchema = z.object({ tenantId: z.number(), targetRoomId: z.number() });

export async function POST(req: NextRequest) {
  try {
    const { tenantId, targetRoomId } = moveSchema.parse(await req.json());
    await moveTenant(tenantId, targetRoomId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Internal" },
      { status: 400 },
    );
  }
}
