"use client";
import React from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import toast from "react-hot-toast";

interface DragDropProviderProps {
  children: React.ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
}) => {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.data.current) {
      // over may not have node property in types, use document.elementFromPoint hack
      const elm = document.querySelector(`[data-room-id]`)!; // simplistic
      const tenantId = active.data.current.tenantId;
      const roomIdAttr = elm ? elm.getAttribute("data-room-id") : null;
      if (roomIdAttr) {
        const targetRoomId = parseInt(roomIdAttr, 10);
        try {
          const res = await fetch(`/api/rooms/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tenantId, targetRoomId }),
          });
          if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || "move failed");
          }
          // optimistic refresh
          if ((window as any).refreshRooms) (window as any).refreshRooms();
        } catch (e: any) {
          toast.error(e.message);
        }
      }
    }
  };

  return <DndContext onDragEnd={handleDragEnd}>{children}</DndContext>;
};
