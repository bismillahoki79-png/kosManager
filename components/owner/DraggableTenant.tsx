'use client'

import { useDraggable } from '@dnd-kit/core'

interface Props {
  tenant: {
    id: string
    full_name: string | null
    email: string
  }
}

export default function DraggableTenant({ tenant }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tenant.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-3 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
          {(tenant.full_name || tenant.email).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 truncate">
            {tenant.full_name || 'Tanpa Nama'}
          </p>
          <p className="text-xs text-gray-500 truncate">{tenant.email}</p>
        </div>
      </div>
    </div>
  )
}
