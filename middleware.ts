import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SessionData, sessionOptions } from './lib/auth'

export async function middleware(request: NextRequest) {
    // Allow access to login page and API login endpoint
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/api/auth/login') {
        return NextResponse.next()
    }

    // Check if user is authenticated by looking for session cookie
    const sessionCookie = request.cookies.get(sessionOptions.cookieName)

    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
