'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Gift, GiftStatus } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'

interface DraggableGiftItemProps {
    gift: Gift
    onEdit: (gift: Gift) => void
}

const statusConfig = {
    IDEA: { icon: '💡', color: 'bg-yellow-100 text-yellow-800' },
    ORDERED: { icon: '📦', color: 'bg-blue-100 text-blue-800' },
    RECEIVED: { icon: '✅', color: 'bg-green-100 text-green-800' },
    WRAPPED: { icon: '🎁', color: 'bg-purple-100 text-purple-800' },
    GIVEN: { icon: '🎉', color: 'bg-gray-100 text-gray-800' },
}

export default function DraggableGiftItem({ gift, onEdit }: DraggableGiftItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: gift.id, data: { type: 'gift', gift } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    const config = statusConfig[gift.status]

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onEdit(gift)}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{gift.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {gift.price && (
                            <span className="font-semibold text-green-600">
                                {formatCurrency(gift.price)}
                            </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded-full ${config.color}`}>
                            {config.icon}
                        </span>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(gift)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        ✎
                    </button>
                </div>
            </div>
        </div>
    )
}
