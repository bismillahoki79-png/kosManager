'use client'

import { useDraggable } from '@dnd-kit/core'
import { Card, CardContent } from '@/components/ui/card'

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
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-primary ring-offset-2' : 'opacity-100'
      }`}
    >
      <CardContent className="p-3 flex items-center space-x-3">
        <div className="flex-shrink-0 h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
          {(tenant.full_name || tenant.email).charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-gray-900 truncate">
            {tenant.full_name || 'Tanpa Nama'}
          </p>
          <p className="text-xs text-muted-foreground truncate">{tenant.email}</p>
        </div>
      </CardContent>
    </Card>
  )
}
