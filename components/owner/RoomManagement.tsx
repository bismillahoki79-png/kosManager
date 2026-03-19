'use client'

import { useState } from 'react'
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import DraggableTenant from './DraggableTenant'
import DroppableRoom from './DroppableRoom'
import { createClient } from '@/lib/supabase/client'

type Tenant = {
  id: string
  full_name: string | null
  email: string
}

type Room = {
  id: string
  name: string
  status: 'Available' | 'Occupied' | 'Storage'
  base_price: number
}

interface Props {
  initialRooms: Room[]
  initialUnassignedTenants: Tenant[]
  initialRoomTenants: Record<string, Tenant>
}

export default function RoomManagement({ initialRooms, initialUnassignedTenants, initialRoomTenants }: Props) {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [unassignedTenants, setUnassignedTenants] = useState<Tenant[]>(initialUnassignedTenants)
  const [roomTenants, setRoomTenants] = useState<Record<string, Tenant>>(initialRoomTenants)
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const tenant = unassignedTenants.find(t => t.id === active.id)
    if (tenant) {
      setActiveTenant(tenant)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTenant(null)

    if (!over) return

    const tenantId = active.id as string
    const roomId = over.id as string

    // Check if dragging an unassigned tenant to an available room
    const tenant = unassignedTenants.find(t => t.id === tenantId)
    const room = rooms.find(r => r.id === roomId)

    if (tenant && room && room.status === 'Available') {
      setIsLoading(true)
      try {
        // 1. Create a new lease
        const { error: leaseError } = await supabase.from('leases').insert({
          tenant_id: tenantId,
          room_id: roomId,
          start_date: new Date().toISOString().split('T')[0],
          billing_cycle: 1,
          custom_price: room.base_price
        })

        if (leaseError) throw leaseError

        // 2. Update room status
        const { error: roomError } = await supabase.from('rooms').update({
          status: 'Occupied'
        }).eq('id', roomId)

        if (roomError) throw roomError

        // 3. Create room history
        await supabase.from('room_history').insert({
          room_id: roomId,
          tenant_id: tenantId,
          action: 'Moved In',
          notes: 'Assigned via Drag and Drop'
        })

        // Update local state
        setUnassignedTenants(prev => prev.filter(t => t.id !== tenantId))
        setRoomTenants(prev => ({ ...prev, [roomId]: tenant }))
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: 'Occupied' } : r))
        
        alert('Berhasil menempatkan penyewa ke kamar!')
      } catch (error: any) {
        console.error('Error assigning tenant:', error)
        alert('Gagal menempatkan penyewa: ' + error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Unassigned Tenants List */}
        <div className="col-span-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">Penyewa Belum Ada Kamar</h3>
          <div className="space-y-3">
            {unassignedTenants.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Semua penyewa sudah mendapat kamar.</p>
            ) : (
              unassignedTenants.map(tenant => (
                <DraggableTenant key={tenant.id} tenant={tenant} />
              ))
            )}
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="col-span-1 md:col-span-3">
          <h3 className="font-semibold text-gray-700 mb-4">Daftar Kamar</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map(room => (
              <DroppableRoom 
                key={room.id} 
                room={room} 
                tenant={roomTenants[room.id]} 
              />
            ))}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeTenant ? (
          <div className="bg-white p-3 rounded-md shadow-lg border border-indigo-200 opacity-90 cursor-grabbing">
            <p className="font-medium text-sm">{activeTenant.full_name || 'Tanpa Nama'}</p>
            <p className="text-xs text-gray-500">{activeTenant.email}</p>
          </div>
        ) : null}
      </DragOverlay>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-md">
            Memproses...
          </div>
        </div>
      )}
    </DndContext>
  )
}
