import React from "react";
import { Tenant } from "@prisma/client";
import { useDraggable } from "@dnd-kit/core";

interface TenantCardProps {
  tenant: Tenant;
}
const TenantCard: React.FC<TenantCardProps> = ({ tenant }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `tenant-${tenant.id}`,
    data: { tenantId: tenant.id },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 border bg-white cursor-grab"
    >
      <p>{tenant.fullName}</p>
    </div>
  );
};

export default TenantCard;
