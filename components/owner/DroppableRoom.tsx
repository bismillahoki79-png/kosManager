'use client'

import { useDroppable } from '@dnd-kit/core'

interface Props {
  room: {
    id: string
    name: string
    status: 'Available' | 'Occupied' | 'Storage'
    base_price: number
  }
  tenant?: {
    full_name: string | null
    email: string
  }
}

export default function DroppableRoom({ room, tenant }: Props) {
  const { isOver, setNodeRef } = useDroppable({
    id: room.id,
    disabled: room.status !== 'Available',
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800 border-green-200'
      case 'Occupied': return 'bg-red-100 text-red-800 border-red-200'
      case 'Storage': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const isHighlighted = isOver && room.status === 'Available'

  return (
    <div
      ref={setNodeRef}
      className={`relative p-4 rounded-lg border-2 transition-all ${
        isHighlighted 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-gray-200 bg-white'
      } ${room.status === 'Available' ? 'hover:border-indigo-300' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-lg text-gray-800">{room.name}</h4>
        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(room.status)}`}>
          {room.status}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        Rp {room.base_price.toLocaleString('id-ID')} / bulan
      </div>

      <div className={`mt-2 p-3 rounded-md min-h-[60px] flex items-center ${
        tenant ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50 border border-dashed border-gray-300'
      }`}>
        {tenant ? (
          <div className="flex items-center space-x-3 w-full">
             <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
              {(tenant.full_name || tenant.email).charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tenant.full_name || 'Tanpa Nama'}
              </p>
              <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center w-full italic">
            {room.status === 'Available' ? 'Tarik penyewa ke sini' : 'Kamar tidak tersedia'}
          </p>
        )}
      </div>
    </div>
  )
}
