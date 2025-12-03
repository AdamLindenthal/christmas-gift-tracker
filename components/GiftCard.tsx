'use client'

import { Gift, GiftStatus, Person } from '@prisma/client'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface GiftWithPerson extends Gift {
    person: Person
}

interface GiftCardProps {
    gift: GiftWithPerson
    onEdit: (gift: GiftWithPerson) => void
    onDelete: (id: string) => void
    onStatusChange: (id: string, status: GiftStatus) => void
}

const statusConfig = {
    IDEA: { label: 'Nápad', icon: '💡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    ORDERED: { label: 'Objednáno', icon: '📦', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    RECEIVED: { label: 'Doručeno', icon: '✅', color: 'bg-green-100 text-green-800 border-green-300' },
    WRAPPED: { label: 'Zabaleno', icon: '🎁', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    GIVEN: { label: 'Předáno', icon: '🎉', color: 'bg-gray-100 text-gray-800 border-gray-300' },
}

export default function GiftCard({
    gift,
    onEdit,
    onDelete,
    onStatusChange
}: GiftCardProps) {
    const [showActions, setShowActions] = useState(false)
    const config = statusConfig[gift.status]

    return (
        <div
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-2 border-green-100 hover:border-green-300"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{gift.name}</h3>
                        <p className="text-sm text-gray-600">pro {gift.person.name}</p>
                    </div>
                    <div className="text-2xl">{config.icon}</div>
                </div>

                {gift.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{gift.description}</p>
                )}

                <div className="space-y-2 mb-3">
                    {gift.price && (
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Cena</span>
                            <span className="font-bold text-green-600" suppressHydrationWarning>{formatCurrency(gift.price)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-sm">Stav</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                </div>

                {gift.url && (
                    <a
                        href={gift.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm block mb-3 truncate"
                        onClick={(e) => e.stopPropagation()}
                    >
                        🔗 Odkaz na produkt
                    </a>
                )}

                {showActions && (
                    <div className="flex gap-2 mt-3">
                        <select
                            value={gift.status}
                            onChange={(e) => onStatusChange(gift.id, e.target.value as GiftStatus)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="IDEA">💡 Nápad</option>
                            <option value="ORDERED">📦 Objednáno</option>
                            <option value="RECEIVED">✅ Doručeno</option>
                            <option value="WRAPPED">🎁 Zabaleno</option>
                            <option value="GIVEN">🎉 Předáno</option>
                        </select>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(gift)
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Upravit
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Smazat ${gift.name}?`)) {
                                    onDelete(gift.id)
                                }
                            }}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Smazat
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
