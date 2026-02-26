"use client";
import React, { useEffect, useState } from "react";
import RoomCard from "./RoomCard";
import { DragDropProvider } from "./DragDropProvider";
import { Prisma } from "@prisma/client";

type RoomWithTenant = Prisma.RoomGetPayload<{
  include: { currentTenant: true };
}>;

export const RoomsGrid: React.FC = () => {
  const [rooms, setRooms] = useState<RoomWithTenant[]>([]);

  useEffect(() => {
    fetch("/api/rooms/list")
      .then((r) => r.json())
      .then((data) => setRooms(data))
      .catch(console.error);
  }, []);

  const refresh = async () => {
    const r = await fetch("/api/rooms/list");
    const data = await r.json();
    setRooms(data);
  };

  // expose refresh to global for now
  useEffect(() => {
    (window as any).refreshRooms = refresh;
  }, []);

  return (
    <DragDropProvider>
      <div className="grid grid-cols-4 gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </DragDropProvider>
  );
};
