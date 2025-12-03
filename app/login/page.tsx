'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            })

            const data = await response.json()

            if (data.success) {
                router.push('/')
                router.refresh()
            } else {
                setError(data.error || 'Neplatné heslo')
            }
        } catch (err) {
            setError('Došlo k chybě. Zkuste to prosím znovu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-900 via-red-800 to-green-900 p-4">
            {/* Animated snowflakes */}
            <div className="snowflakes" aria-hidden="true">
                <div className="snowflake">❅</div>
                <div className="snowflake">❆</div>
                <div className="snowflake">❅</div>
                <div className="snowflake">❆</div>
                <div className="snowflake">❅</div>
                <div className="snowflake">❆</div>
                <div className="snowflake">❅</div>
            </div>

            <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center">
                    <h1 className="text-5xl font-bold text-white mb-2 font-christmas">
                        🎄 Vánoční Dárky 🎁
                    </h1>
                    <p className="text-red-100 text-lg">
                        Váš vánoční organizátor
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Heslo
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="appearance-none relative block w-full px-4 py-3 border border-white/30 placeholder-gray-400 text-white bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm text-lg"
                            placeholder="Zadejte heslo"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="text-red-200 text-sm text-center bg-red-900/50 p-3 rounded-lg border border-red-500/50">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        {loading ? 'Přihlašování...' : 'Vstoupit 🎅'}
                    </button>
                </form>

                <p className="text-center text-red-100 text-sm mt-4">
                    Vyrobeno s ❤️ pro sledování vánoční radosti
                </p>
            </div>
        </div>
    )
}
