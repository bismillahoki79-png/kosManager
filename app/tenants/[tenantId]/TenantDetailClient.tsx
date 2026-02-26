"use client";
import React, { useState } from "react";
import { Tenant, Invoice } from "@prisma/client";
import Link from "next/link";

interface Props {
  tenant: Tenant & { room?: { name: string } | null; invoices: Invoice[] };
}

const TenantDetailClient: React.FC<Props> = ({ tenant }) => {
  const [status, setStatus] = useState(tenant.status);
  const [invoices, setInvoices] = useState(tenant.invoices);

  const doAction = async (action: string) => {
    const res = await fetch(`/api/tenants/${tenant.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setStatus(
        action === "reserve"
          ? "RESERVED"
          : action === "activate"
            ? "ACTIVE"
            : "CHECKED_OUT",
      );
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-2">{tenant.fullName}</h1>
      <p>Status: {status}</p>
      <p>Room: {tenant.room?.name || "-"}</p>
      <p>Monthly start: {tenant.monthlyStartMonth}</p>
      <p>Storage start: {tenant.storageStartMonth || "-"}</p>
      <h2 className="mt-4">Invoices</h2>
      <ul>
        {invoices.map((inv) => (
          <li key={inv.id}>
            {inv.year}-{inv.month} {inv.type} {inv.amount} {inv.status}
          </li>
        ))}
      </ul>
      <div className="mt-4 space-x-2">
        <Link href={`/api/tenants/${tenant.id}/pay`}>
          <button className="btn">Bayar Sekarang</button>
        </Link>
        {status !== "RESERVED" && (
          <button className="btn" onClick={() => doAction("reserve")}>
            Set Reserved
          </button>
        )}
        {status !== "ACTIVE" && (
          <button className="btn" onClick={() => doAction("activate")}>
            Activate
          </button>
        )}
        {status !== "CHECKED_OUT" && (
          <button className="btn" onClick={() => doAction("checkout")}>
            Checkout
          </button>
        )}
      </div>
    </div>
  );
};

export default TenantDetailClient;
