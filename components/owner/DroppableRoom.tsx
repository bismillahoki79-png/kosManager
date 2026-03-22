"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, GripVertical } from "lucide-react";
import { useState, useEffect } from "react";

interface Tenant {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  room: {
    id: string;
    name: string;
    status: "Available" | "Occupied" | "Storage";
    base_price: number;
    max_tenants?: number;
  };
  tenants?: Tenant[];
  onCheckoutTenant?: (tenant: Tenant, roomId: string) => void;
}

function DraggableInRoomTenant({
  tenant,
  onCheckout,
}: {
  tenant: Tenant;
  onCheckout?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: tenant.id, // the string ID is enough, dnd-kit uses it globally
      data: { isRelocating: true }, // to distinguish later if needed
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      title="Tarik untuk memindahkan penyewa"
      className={`group flex items-center space-x-3 w-full bg-white p-2.5 rounded-md border transition-all cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-70 ring-2 ring-indigo-500 shadow-xl border-indigo-200 scale-105"
          : "border-slate-100 hover:border-indigo-300 shadow-sm hover:shadow"
      }`}
    >
      <div className="shrink-0 text-slate-300 group-hover:text-indigo-400">
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="shrink-0 h-9 w-9 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-100">
        {(tenant.full_name || tenant.email).charAt(0).toUpperCase()}
      </div>
      <div className="overflow-hidden flex-1">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {tenant.full_name || "Tanpa Nama"}
        </p>
        <p className="text-xs text-slate-500 truncate">{tenant.email}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onCheckout?.();
        }}
        className="text-xs text-red-600 hover:text-red-700 ml-2 px-2 py-1 border border-red-100 rounded-md"
      >
        Keluar
      </button>
    </div>
  );
}

export default function DroppableRoom({
  room,
  tenants = [],
  onCheckoutTenant,
}: Props) {
  const isFull = tenants.length >= (room.max_tenants || 1);
  const status = isFull ? "Occupied" : room.status;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { isOver, setNodeRef } = useDroppable({
    id: room.id,
    disabled: isFull || status === "Storage",
  });

  const getBadgeVariant = (s: string) => {
    switch (s) {
      case "Available":
        return "default";
      case "Occupied":
        return "destructive";
      case "Storage":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isHighlighted = isOver && !isFull && status !== "Storage";

  if (!isMounted) {
    return <div className="h-50 w-full bg-slate-100 animate-pulse rounded-xl" />;
  }

  return (
    <Card
      ref={setNodeRef}
      className={`relative transition-all shadow-sm ${
        isHighlighted
          ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/50"
          : "bg-white border-slate-200"
      } ${!isFull && status !== "Storage" ? "hover:border-indigo-300" : ""}`}
    >
      <CardHeader className="p-5 pb-3 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-lg font-bold text-slate-800">
            {room.name}
          </CardTitle>
          <Badge
            variant={getBadgeVariant(status) as any}
            className="shadow-none font-medium"
          >
            {status}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {room.base_price > 0
              ? `Rp ${room.base_price.toLocaleString("id-ID")} / bln`
              : "Harga Bebas"}
          </span>
          <span className="flex items-center text-slate-500 font-medium">
            <Users className="w-3.5 h-3.5 mr-1" />
            {tenants.length} / {room.max_tenants || 1}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div
          className={`p-3 flex flex-col gap-2 rounded-lg min-h-20 ${
            tenants.length > 0
              ? "bg-slate-50 border border-slate-100 shadow-inner"
              : "bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center"
          }`}
        >
          {tenants.length > 0 ? (
            tenants.map((tenant) => (
              <DraggableInRoomTenant
                key={tenant.id}
                tenant={tenant}
                onCheckout={() => onCheckoutTenant?.(tenant, room.id)}
              />
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center w-full italic">
              Tarik penyewa ke kamar ini
            </p>
          )}

          {!isFull && tenants.length > 0 && (
            <p className="text-xs text-slate-400 text-center w-full italic mt-2 border-t border-dashed border-slate-200 pt-3">
              Sisa {(room.max_tenants || 1) - tenants.length} slot kursi
            </p>
          )}

          {isFull && tenants.length === 0 && (
            <p className="text-xs text-center w-full italic text-destructive">
              Kamar tidak tersedia
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
