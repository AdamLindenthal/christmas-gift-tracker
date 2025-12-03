'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import ConfirmModal from '@/components/ConfirmModal'
import {
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'
import { Person, Gift, GiftStatus } from '@prisma/client'
import PersonCard from '@/components/PersonCard'
import GiftCard from '@/components/GiftCard'
import DraggableGiftItem from '@/components/DraggableGiftItem'
import { formatCurrency } from '@/lib/utils'

interface PersonWithStats extends Person {
  totalSpent: number
  spent: number
  planned: number
  giftCount: number
}

interface GiftWithPerson extends Gift {
  person: Person | null
  location: string | null
}

type View = 'board' | 'list'
type ListViewMode = 'grid' | 'table'
type SortConfig = { key: keyof GiftWithPerson | 'personName', direction: 'asc' | 'desc' }
type FilterConfig = { search: string, personId: string, status: string }

export default function Home() {
  const router = useRouter()
  const [view, setView] = useState<View>('board')
  const [listViewMode, setListViewMode] = useState<ListViewMode>('grid')
  const [people, setPeople] = useState<PersonWithStats[]>([])
  const [gifts, setGifts] = useState<GiftWithPerson[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [showPersonModal, setShowPersonModal] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [personToDelete, setPersonToDelete] = useState<PersonWithStats | null>(null)
  const [giftToDelete, setGiftToDelete] = useState<GiftWithPerson | null>(null)
  const [editingPerson, setEditingPerson] = useState<PersonWithStats | null>(null)
  const [editingGift, setEditingGift] = useState<GiftWithPerson | null>(null)
  const [preselectedPersonId, setPreselectedPersonId] = useState<string | undefined>(undefined)

  // Sort and Filter state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' })
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({ search: '', personId: '', status: '' })

  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    await Promise.all([fetchPeople(), fetchGifts()])
    setLoading(false)
  }

  const fetchPeople = async () => {
    try {
      const res = await fetch('/api/people')
      const peopleData = await res.json()

      // Calculate stats from gifts
      // We need gifts to calculate stats, but gifts might not be loaded yet or we can calculate from the gifts state if we ensure order
      // Better: fetch people and gifts, then combine. 
      // Actually, the API /api/people might be returning stats? 
      // Let's check /api/people. It probably returns stats based on DB. 
      // But we want to calculate based on loaded gifts to be in sync.
      // For now, let's assume /api/people returns basic info and we calculate stats in render or effect?
      // The current implementation of /api/people probably calculates totalSpent.
      // Let's rely on the API for now, but we need to update the API to return split stats OR calculate client side.
      // Calculating client side is safer for immediate updates.

      setPeople(peopleData) // We will update stats in a separate effect or memo
    } catch (error) {
      console.error('Failed to fetch people:', error)
    }
  }

  const fetchGifts = async () => {
    try {
      const res = await fetch('/api/gifts')
      const data = await res.json()
      setGifts(data)
    } catch (error) {
      console.error('Failed to fetch gifts:', error)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const handleDeletePerson = async () => {
    if (!personToDelete) return

    try {
      const res = await fetch(`/api/people/${personToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        console.error('Delete failed:', err)
        throw new Error(`Failed to delete person: ${err.message || res.statusText}`)
      }
      setPersonToDelete(null)
      fetchPeople()
      fetchGifts()
    } catch (error) {
      console.error('Error deleting person:', error)
    }
  }

  const handleDeleteGift = async () => {
    if (!giftToDelete) return

    try {
      await fetch(`/api/gifts/${giftToDelete.id}`, { method: 'DELETE' })
      setGiftToDelete(null)
      fetchGifts()
      fetchPeople()
    } catch (error) {
      console.error('Failed to delete gift:', error)
    }
  }

  const handleStatusChange = async (id: string, status: GiftStatus) => {
    try {
      await fetch(`/api/gifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchGifts()
    } catch (error) {
      console.error('Failed to update gift status:', error)
    }
  }

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const giftId = active.id as string
    const overId = over.id as string

    // Find the gift being dragged
    const gift = gifts.find(g => g.id === giftId)
    if (!gift) return

    // Determine target person ID
    let targetPersonId: string | null = null

    // Check if dropped on a person card
    const isPerson = people.find(p => p.id === overId)
    if (isPerson) {
      targetPersonId = isPerson.id
    } else {
      // Check if dropped on another gift
      const overGift = gifts.find(g => g.id === overId)
      if (overGift && overGift.personId) {
        targetPersonId = overGift.personId
      } else {
        return // Invalid drop target
      }
    }

    // Only update if person changed
    if (gift.personId !== targetPersonId) {
      // Optimistic update
      setGifts(prev => prev.map(g =>
        g.id === giftId ? { ...g, personId: targetPersonId } : g
      ))

      // Refresh people stats optimistically (simplified) or just wait for fetch
      // We'll trigger a fetch to be safe and accurate

      try {
        await fetch(`/api/gifts/${giftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId: targetPersonId }),
        })
        fetchPeople() // Update stats
        fetchGifts() // Ensure sync
      } catch (error) {
        console.error('Failed to move gift:', error)
        fetchGifts() // Revert on error
      }
    }
  }

  // Calculate derived stats
  const peopleWithStats = people.map(person => {
    const personGifts = gifts.filter(g => g.personId === person.id)
    const spent = personGifts
      .filter(g => g.status !== 'IDEA' && g.price)
      .reduce((sum, g) => sum + (g.price || 0), 0)
    const planned = personGifts
      .filter(g => g.status === 'IDEA' && g.price)
      .reduce((sum, g) => sum + (g.price || 0), 0)

    return {
      ...person,
      giftCount: personGifts.length,
      spent,
      planned,
      totalSpent: spent + planned
    }
  })

  const totalSpentReal = peopleWithStats.reduce((sum, p) => sum + p.spent, 0)
  const totalPlanned = peopleWithStats.reduce((sum, p) => sum + p.planned, 0)
  const totalGifts = gifts.length

  // Filter and Sort Gifts
  const filteredGifts = gifts.filter(gift => {
    const matchesSearch = gift.name.toLowerCase().includes(filterConfig.search.toLowerCase()) ||
      (gift.description?.toLowerCase().includes(filterConfig.search.toLowerCase()) ?? false)
    const matchesPerson = filterConfig.personId ? gift.personId === filterConfig.personId : true
    const matchesStatus = filterConfig.status ? gift.status === filterConfig.status : true
    return matchesSearch && matchesPerson && matchesStatus
  })

  const sortedGifts = [...filteredGifts].sort((a, b) => {
    const { key, direction } = sortConfig
    let aValue: any = a[key as keyof GiftWithPerson]
    let bValue: any = b[key as keyof GiftWithPerson]

    if (key === 'personName') {
      aValue = a.person?.name || ''
      bValue = b.person?.name || ''
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (key: keyof GiftWithPerson | 'personName') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  if (loading && people.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-green-50">
        <div className="text-2xl font-christmas text-red-600">Načítání... 🎄</div>
      </div>
    )
  }

  const activeGift = activeId ? gifts.find(g => g.id === activeId) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-green-600 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-4xl font-christmas text-white font-bold flex items-center gap-2">
              🎄 Vánoční Dárky 🎁
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm text-sm sm:text-base"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white shadow-md border-b-4 border-red-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Celkem dárků</p>
              <p className="text-2xl font-bold text-red-600">{totalGifts}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Utraceno / V plánu</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-green-600" suppressHydrationWarning>{formatCurrency(totalSpentReal)}</span>
                <span className="text-gray-400">/</span>
                <span className="text-lg font-medium text-gray-500" suppressHydrationWarning>{formatCurrency(totalPlanned)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => setView('board')}
              className={`px-6 py-3 font-medium transition-all flex-1 sm:flex-none text-center ${view === 'board'
                ? 'text-red-600 border-b-4 border-red-600'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              👥 Přehled
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-6 py-3 font-medium transition-all flex-1 sm:flex-none text-center ${view === 'list'
                ? 'text-red-600 border-b-4 border-red-600'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              🎁 Všechny dárky
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">

        {view === 'board' && (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Dárky podle osob</h2>
              <button
                onClick={() => {
                  setEditingPerson(null)
                  setShowPersonModal(true)
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-green-500 text-white rounded-lg hover:from-red-600 hover:to-green-600 transition-all shadow hover:shadow-lg font-medium"
              >
                + Přidat osobu
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {peopleWithStats.map(person => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    gifts={gifts.filter(g => g.personId === person.id)}
                    onEdit={(p) => { setEditingPerson(p); setShowPersonModal(true); }}
                    onDelete={() => setPersonToDelete(person)}
                    onAddGift={(personId) => {
                      setEditingGift(null)
                      setPreselectedPersonId(personId)
                      setShowGiftModal(true)
                    }}
                    onEditGift={(g) => {
                      // Need to cast to GiftWithPerson or fetch full object? 
                      // The gift object from map already has personId, we can find the full object or just pass it
                      // But GiftCard expects GiftWithPerson. 
                      // Actually DraggableGiftItem passes Gift.
                      // We need to set editing gift.
                      const fullGift = gifts.find(item => item.id === g.id)
                      if (fullGift) {
                        setEditingGift(fullGift)
                        setShowGiftModal(true)
                      }
                    }}
                  />
                ))}

                {peopleWithStats.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-4xl mb-4">👥</p>
                    <p className="text-lg">Zatím žádné osoby. Přidejte někoho, koho chcete obdarovat!</p>
                  </div>
                )}
              </div>

              <DragOverlay>
                {activeGift ? (
                  <div className="transform rotate-3 cursor-grabbing">
                    <DraggableGiftItem gift={activeGift} onEdit={() => { }} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {view === 'list' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Seznam všech dárků</h2>
              <div className="flex gap-2">
                <div className="bg-gray-100 p-1 rounded-lg flex">
                  <button
                    onClick={() => setListViewMode('grid')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${listViewMode === 'grid' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Mřížka
                  </button>
                  <button
                    onClick={() => setListViewMode('table')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${listViewMode === 'table' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Tabulka
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditingGift(null)
                    setPreselectedPersonId(undefined)
                    setShowGiftModal(true)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-red-500 text-white rounded-lg hover:from-green-600 hover:to-red-600 transition-all shadow hover:shadow-lg font-medium"
                >
                  + Přidat dárek
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hledat</label>
                <input
                  type="text"
                  value={filterConfig.search}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Název, popis..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Osoba</label>
                <select
                  value={filterConfig.personId}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, personId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Všechny osoby</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stav</label>
                <select
                  value={filterConfig.status}
                  onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Všechny stavy</option>
                  <option value="IDEA">💡 Nápad</option>
                  <option value="ORDERED">📦 Objednáno</option>
                  <option value="RECEIVED">✅ Doručeno</option>
                  <option value="WRAPPED">🎁 Zabaleno</option>
                  <option value="GIVEN">🎉 Předáno</option>
                </select>
              </div>
            </div>

            {/* Gifts List */}
            {listViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedGifts.map(gift => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    onEdit={(g) => { setEditingGift(g); setShowGiftModal(true); }}
                    onDelete={() => setGiftToDelete(gift)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        Dárek {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('personName')}
                      >
                        Pro koho {sortConfig.key === 'personName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('price')}
                      >
                        Cena {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th
                        className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        Stav {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedGifts.map(gift => (
                      <GiftTableRow
                        key={gift.id}
                        gift={gift}
                        onEdit={(g) => { setEditingGift(g); setShowGiftModal(true); }}
                        onDelete={() => setGiftToDelete(gift)}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {gifts.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-4xl mb-4">🎁</p>
                <p className="text-lg">Zatím žádné dárky. Začněte přidávat!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Person Modal */}
      {showPersonModal && (
        <PersonModal
          person={editingPerson}
          onClose={() => {
            setShowPersonModal(false)
            setEditingPerson(null)
          }}
          onSave={() => {
            setShowPersonModal(false)
            setEditingPerson(null)
            fetchPeople()
          }}
        />
      )}

      {/* Gift Modal */}
      {showGiftModal && (
        <GiftModal
          gift={editingGift}
          people={people}
          initialPersonId={preselectedPersonId}
          onClose={() => {
            setShowGiftModal(false)
            setEditingGift(null)
            setPreselectedPersonId(undefined)
          }}
          onSave={() => {
            setShowGiftModal(false)
            setEditingGift(null)
            setPreselectedPersonId(undefined)
            fetchGifts()
            fetchPeople()
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!personToDelete}
        title="Smazat osobu?"
        message={`Opravdu chcete smazat ${personToDelete?.name}? Tím se smažou i všechny dárky přiřazené k této osobě.`}
        confirmLabel="Smazat"
        isDangerous={true}
        onConfirm={handleDeletePerson}
        onCancel={() => setPersonToDelete(null)}
      />

      {/* Confirm Delete Gift Modal */}
      <ConfirmModal
        isOpen={!!giftToDelete}
        title="Smazat dárek?"
        message={`Opravdu chcete smazat dárek "${giftToDelete?.name}"?`}
        confirmLabel="Smazat"
        isDangerous={true}
        onConfirm={handleDeleteGift}
        onCancel={() => setGiftToDelete(null)}
      />
    </div>
  )
}

// Person Modal Component
function PersonModal({
  person,
  onClose,
  onSave
}: {
  person: PersonWithStats | null
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState(person?.name || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = person ? `/api/people/${person.id}` : '/api/people'
      const method = person ? 'PUT' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
        }),
      })

      onSave()
    } catch (error) {
      console.error('Failed to save person:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {person ? 'Upravit osobu' : 'Přidat osobu'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jméno *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="např. Mamka, Jan, Sára"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-green-500 text-white rounded-lg hover:from-red-600 hover:to-green-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Gift Modal Component
function GiftModal({
  gift,
  people,
  initialPersonId,
  onClose,
  onSave
}: {
  gift: GiftWithPerson | null
  people: PersonWithStats[]
  initialPersonId?: string
  onClose: () => void
  onSave: () => void
}) {
  const [name, setName] = useState(gift?.name || '')
  const [description, setDescription] = useState(gift?.description || '')
  const [price, setPrice] = useState(gift?.price?.toString() || '')
  const [status, setStatus] = useState<GiftStatus>(gift?.status || 'IDEA')
  const [url, setUrl] = useState(gift?.url || '')
  const [location, setLocation] = useState(gift?.location || '')
  const [notes, setNotes] = useState(gift?.notes || '')
  const [personId, setPersonId] = useState(gift?.personId || initialPersonId || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = gift ? `/api/gifts/${gift.id}` : '/api/gifts'
      const method = gift ? 'PUT' : 'POST'

      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          price: price ? parseFloat(price) : null,
          status,
          url: url || null,
          location: location || null,
          notes: notes || null,
          personId: personId || null, // Allow null for unassigned
        }),
      })

      onSave()
    } catch (error) {
      console.error('Failed to save gift:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {gift ? 'Upravit dárek' : 'Přidat dárek'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Název dárku *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="např. Svetr, Kniha, Hra"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pro koho
            </label>
            <select
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Nezařazeno --</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Popis
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="Volitelné detaily..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cena (Kč)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stav
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GiftStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="IDEA">💡 Nápad</option>
                <option value="ORDERED">📦 Objednáno</option>
                <option value="RECEIVED">✅ Doručeno</option>
                <option value="WRAPPED">🎁 Zabaleno</option>
                <option value="GIVEN">🎉 Předáno</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odkaz na produkt
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poznámky
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Velikost, barva, kde koupit..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Umístění (kde je dárek schovaný)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="např. Ve skříni, V garáži..."
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-red-500 text-white rounded-lg hover:from-green-600 hover:to-red-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GiftTableRow({
  gift,
  onEdit,
  onDelete,
  onStatusChange
}: {
  gift: GiftWithPerson
  onEdit: (gift: GiftWithPerson) => void
  onDelete: () => void
  onStatusChange: (id: string, status: GiftStatus) => void
}) {
  const statusConfig = {
    IDEA: { label: 'Nápad', icon: '💡', color: 'bg-yellow-100 text-yellow-800' },
    ORDERED: { label: 'Objednáno', icon: '📦', color: 'bg-blue-100 text-blue-800' },
    RECEIVED: { label: 'Doručeno', icon: '✅', color: 'bg-green-100 text-green-800' },
    WRAPPED: { label: 'Zabaleno', icon: '🎁', color: 'bg-purple-100 text-purple-800' },
    GIVEN: { label: 'Předáno', icon: '🎉', color: 'bg-gray-100 text-gray-800' },
  }
  const config = statusConfig[gift.status]

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-gray-900">{gift.name}</div>
        {gift.description && <div className="text-sm text-gray-500 truncate max-w-xs">{gift.description}</div>}
      </td>
      {gift.person !== undefined && (
        <td className="px-6 py-4 whitespace-nowrap">
          {gift.person ? (
            <span className="text-sm text-gray-900">{gift.person.name}</span>
          ) : (
            <span className="text-sm text-gray-400 italic">Nezařazeno</span>
          )}
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap">
        {gift.price ? (
          <span className="text-sm font-medium text-green-600" suppressHydrationWarning>{formatCurrency(gift.price)}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <select
          value={gift.status}
          onChange={(e) => onStatusChange(gift.id, e.target.value as GiftStatus)}
          className={`text-xs px-2 py-1 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 ${config.color}`}
        >
          <option value="IDEA">💡 Nápad</option>
          <option value="ORDERED">📦 Objednáno</option>
          <option value="RECEIVED">✅ Doručeno</option>
          <option value="WRAPPED">🎁 Zabaleno</option>
          <option value="GIVEN">🎉 Předáno</option>
        </select>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(gift)}
            className="text-blue-600 hover:text-blue-900"
          >
            Upravit
          </button>
          <button
            onClick={() => {
              onDelete()
            }}
            className="text-red-600 hover:text-red-900"
          >
            Smazat
          </button>
        </div>
      </td>
    </tr>
  )
}
