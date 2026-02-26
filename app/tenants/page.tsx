import React from "react";
import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";

type TenantWithRoom = Prisma.TenantGetPayload<{
  include: { room: true };
}>;

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants: TenantWithRoom[] = await prisma.tenant.findMany({
    include: { room: true },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Tenants</h1>
      <ul>
        {tenants.map((t) => (
          <li key={t.id}>
            <Link href={`/tenants/${t.id}`}>{t.fullName}</Link> - {t.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
