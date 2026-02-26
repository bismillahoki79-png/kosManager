import React from "react";
import { RoomsGrid } from "../../components/RoomsGrid";

export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Rooms</h1>
      <RoomsGrid />
    </div>
  );
}
