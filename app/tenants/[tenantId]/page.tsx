import React from "react";
import { prisma } from "../../../lib/prisma";
import TenantDetailClient from "./TenantDetailClient";

interface Props {
  params: { tenantId: string };
}

export default async function TenantPage({ params }: Props) {
  const tenantId = parseInt(params.tenantId, 10);
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { room: true, invoices: true },
  });
  if (!tenant) return <div>Tenant not found</div>;

  return <TenantDetailClient tenant={tenant} />;
}
