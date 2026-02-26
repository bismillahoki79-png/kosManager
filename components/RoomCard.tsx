import React from "react";
import { Room, Tenant } from "@prisma/client";

interface RoomCardProps {
  room: Room & { currentTenant?: Tenant | null };
}

const RoomCard: React.FC<RoomCardProps> = ({ room }) => {
  const statusColor = {
    AVAILABLE: "bg-green-200",
    OCCUPIED: "bg-red-200",
    RESERVED: "bg-yellow-200",
    MAINTENANCE: "bg-gray-200",
  }[room.status];

  return (
    <div className={`p-4 border ${statusColor}`} data-room-id={room.id}>
      <h3 className="font-bold">{room.name}</h3>
      <p>Price: {room.monthlyPrice}</p>
      <p>Status: {room.status}</p>
      {room.currentTenant && <p>Tenant: {room.currentTenant.fullName}</p>}
    </div>
  );
};

export default RoomCard;
