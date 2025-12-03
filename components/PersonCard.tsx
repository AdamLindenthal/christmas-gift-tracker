'use client'

import { Person } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface PersonWithStats extends Person {
    totalSpent: number
    giftCount: number
}

interface PersonCardProps {
    person: PersonWithStats
    onEdit: (person: PersonWithStats) => void
    onDelete: (id: string) => void
    onClick: (person: PersonWithStats) => void
}

export default function PersonCard({ person, onEdit, onDelete, onClick }: PersonCardProps) {
    const [showActions, setShowActions] = useState(false)

    return (
        <div
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-red-100 hover:border-red-300 cursor-pointer transform hover:scale-105"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onClick={() => onClick(person)}
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">{person.name}</h3>
                        {person.relation && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {person.relation}
                            </span>
                        )}
                    </div>
                    <div className="text-3xl">🎁</div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Dárky</span>
                        <span className="font-semibold text-red-600">{person.giftCount}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Utraceno</span>
                        <span className="font-bold text-green-600" suppressHydrationWarning>
                            {formatCurrency(person.totalSpent)}
                        </span>
                    </div>
                </div>

                {showActions && (
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(person)
                            }}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Upravit
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Smazat ${person.name}? Tím se smažou i všechny dárky.`)) {
                                    onDelete(person.id)
                                }
                            }}
                            className="flex-1 px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Smazat
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
