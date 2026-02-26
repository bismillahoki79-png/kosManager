import React from "react";
import { RoomsGrid } from "../../components/RoomsGrid";

export default function RoomsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">All Rooms</h1>
      <RoomsGrid />
    </div>
  );
}
