'use client'

import { Person, Gift } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import DraggableGiftItem from './DraggableGiftItem'

interface PersonWithStats extends Person {
    totalSpent: number
    spent: number
    planned: number
    giftCount: number
}

interface PersonCardProps {
    person: PersonWithStats
    gifts: Gift[]
    onEdit: (person: PersonWithStats) => void
    onDelete: (id: string) => void
    onAddGift: (personId: string) => void
    onEditGift: (gift: Gift) => void
}

export default function PersonCard({
    person,
    gifts,
    onEdit,
    onDelete,
    onAddGift,
    onEditGift
}: PersonCardProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: person.id,
        data: { type: 'person', person }
    })

    return (
        <div
            ref={setNodeRef}
            className={`bg-white rounded-xl shadow-md flex flex-col h-full border-2 transition-colors ${isOver ? 'border-red-400 bg-red-50' : 'border-red-100'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-red-100 bg-gradient-to-r from-red-50 to-transparent">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800">{person.name}</h3>

                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(person)
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Upravit osobu"
                        >
                            ✎
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(person.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Smazat osobu"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-0.5">
                        {Array.from({ length: gifts.length }).map((_, i) => (
                            <span key={i}>🎁</span>
                        ))}
                    </span>
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-1 ml-auto">
                            <span className="font-bold text-green-600" suppressHydrationWarning>
                                {formatCurrency(person.spent)}
                            </span>
                            {person.planned > 0 && (
                                <span className="font-medium text-gray-400 text-sm" suppressHydrationWarning>
                                    +{formatCurrency(person.planned)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gifts List */}
            <div className="p-4 flex-1 flex flex-col gap-3 min-h-[100px]">
                <SortableContext
                    items={gifts.map(g => g.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {gifts.map(gift => (
                        <DraggableGiftItem
                            key={gift.id}
                            gift={gift}
                            onEdit={onEditGift}
                        />
                    ))}
                </SortableContext>

                {gifts.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-lg">
                        Žádné dárky
                        <br />
                        Přetáhněte sem dárek nebo přidejte nový
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={() => onAddGift(person.id)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-dashed border-gray-300 hover:border-red-300"
                >
                    + Přidat dárek
                </button>
            </div>
        </div>
    )
}
