import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json()
        const session = await getSession()

        // Check against environment variable
        const correctPassword = process.env.APP_PASSWORD || 'christmas2024'

        if (password === correctPassword) {
            session.isLoggedIn = true
            session.createdAt = Date.now()
            await session.save()

            return NextResponse.json({ success: true })
        } else {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            )
        }
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        )
    }
}
