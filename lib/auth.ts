import { getIronSession, IronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
    isLoggedIn: boolean
    createdAt?: number
}

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_development',
    cookieName: 'christmas_gift_tracker_session',
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    },
}

export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies()
    return getIronSession<SessionData>(cookieStore, sessionOptions)
}
