'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Person, Gift, GiftStatus } from '@prisma/client'
import PersonCard from '@/components/PersonCard'
import GiftCard from '@/components/GiftCard'
import { formatCurrency } from '@/lib/utils'

interface PersonWithStats extends Person {
  totalSpent: number
  giftCount: number
}

interface GiftWithPerson extends Gift {
  person: Person
}

type View = 'people' | 'gifts' | 'ideas' | 'ordered'

export default function Home() {
  const router = useRouter()
  const [view, setView] = useState<View>('people')
  const [people, setPeople] = useState<PersonWithStats[]>([])
  const [gifts, setGifts] = useState<GiftWithPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [showPersonModal, setShowPersonModal] = useState(false)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<PersonWithStats | null>(null)
  const [editingGift, setEditingGift] = useState<GiftWithPerson | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<PersonWithStats | null>(null)

  useEffect(() => {
    fetchPeople()
    fetchGifts()
  }, [])

  const fetchPeople = async () => {
    try {
      const res = await fetch('/api/people')
      const data = await res.json()
      setPeople(data)
    } catch (error) {
      console.error('Failed to fetch people:', error)
    } finally {
      setLoading(false)
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

  const handleDeletePerson = async (id: string) => {
    try {
      await fetch(`/api/people/${id}`, { method: 'DELETE' })
      fetchPeople()
      fetchGifts()
    } catch (error) {
      console.error('Failed to delete person:', error)
    }
  }

  const handleDeleteGift = async (id: string) => {
    try {
      await fetch(`/api/gifts/${id}`, { method: 'DELETE' })
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

  const totalSpent = people.reduce((sum, person) => sum + person.totalSpent, 0)
  const totalGifts = gifts.length

  const filteredGifts = view === 'ideas'
    ? gifts.filter(g => g.status === 'IDEA')
    : view === 'ordered'
      ? gifts.filter(g => g.status === 'ORDERED')
      : selectedPerson
        ? gifts.filter(g => g.personId === selectedPerson.id)
        : gifts

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-green-50">
        <div className="text-2xl font-christmas text-red-600">Načítání... 🎄</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-green-600 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-christmas text-white font-bold flex items-center gap-2">
              🎄 Vánoční Dárky 🎁
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
            >
              Odhlásit
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white shadow-md border-b-4 border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">Celkem dárků</p>
              <p className="text-2xl font-bold text-red-600">{totalGifts}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-600 text-sm">Celkem utraceno</p>
              <p className="text-2xl font-bold text-green-600" suppressHydrationWarning>{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b-2 border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => { setView('people'); setSelectedPerson(null); }}
              className={`px-6 py-3 font-medium transition-all ${view === 'people'
                ? 'text-red-600 border-b-4 border-red-600'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              👥 Lidé
            </button>
            <button
              onClick={() => { setView('gifts'); setSelectedPerson(null); }}
              className={`px-6 py-3 font-medium transition-all ${view === 'gifts'
                ? 'text-red-600 border-b-4 border-red-600'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              🎁 Všechny dárky
            </button>
            <button
              onClick={() => { setView('ideas'); setSelectedPerson(null); }}
              className={`px-6 py-3 font-medium transition-all ${view === 'ideas'
                ? 'text-red-600 border-b-4 border-red-600'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              💡 Nápady
            </button>
            <button
              onClick={() => { setView('ordered'); setSelectedPerson(null); }}
              className={`px-6 py-3 font-medium transition-all ${view === 'ordered'
                ? 'text-red-600 border-b-4 border-red-600'
                : 'text-gray-600 hover:text-red-600'
                }`}
            >
              📦 Objednané
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedPerson && (
          <div className="mb-6 bg-gradient-to-r from-green-100 to-red-100 p-4 rounded-xl border-2 border-green-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                Dárky pro {selectedPerson.name}
              </h2>
              <button
                onClick={() => setSelectedPerson(null)}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Zpět na přehled
              </button>
            </div>
          </div>
        )}

        {view === 'people' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Seznam obdarovaných</h2>
              <button
                onClick={() => {
                  setEditingPerson(null)
                  setShowPersonModal(true)
                }}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-green-500 text-white rounded-lg hover:from-red-600 hover:to-green-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                + Přidat osobu
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {people.map(person => (
                <PersonCard
                  key={person.id}
                  person={person}
                  onEdit={(p) => { setEditingPerson(p); setShowPersonModal(true); }}
                  onDelete={handleDeletePerson}
                  onClick={(p) => { setSelectedPerson(p); setView('gifts'); }}
                />
              ))}
            </div>
          </>
        )}

        {(view === 'gifts' || view === 'ideas' || view === 'ordered' || selectedPerson) && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {view === 'ideas' ? 'Nápady na dárky' : view === 'ordered' ? 'Objednané dárky' : 'Všechny dárky'}
              </h2>
              <button
                onClick={() => {
                  setEditingGift(null)
                  setShowGiftModal(true)
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-red-500 text-white rounded-lg hover:from-green-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                + Přidat dárek
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGifts.map(gift => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  onEdit={(g) => { setEditingGift(g); setShowGiftModal(true); }}
                  onDelete={handleDeleteGift}
                  onStatusChange={handleStatusChange}
                />
              ))}
              {filteredGifts.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <p className="text-4xl mb-4">🎁</p>
                  <p className="text-lg">Zatím žádné dárky. Začněte přidávat!</p>
                </div>
              )}
            </div>
          </>
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
          initialPersonId={selectedPerson?.id}
          onClose={() => {
            setShowGiftModal(false)
            setEditingGift(null)
          }}
          onSave={() => {
            setShowGiftModal(false)
            setEditingGift(null)
            fetchGifts()
            fetchPeople()
          }}
        />
      )}
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
  const [relation, setRelation] = useState(person?.relation || '')
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
          relation: relation || null,
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vztah
            </label>
            <input
              type="text"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="např. Matka, Kamarád, Bratr"
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
          notes: notes || null,
          personId,
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
              Pro koho *
            </label>
            <select
              required
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Vyberte osobu</option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              rows={2}
              placeholder="Další poznámky..."
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
