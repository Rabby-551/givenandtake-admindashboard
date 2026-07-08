// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000
const LAST_ACTIVITY_COOKIE = 'gnt_last_activity'

const withActivityCookie = (request: NextRequest, response: NextResponse) => {
  response.cookies.set(LAST_ACTIVITY_COOKIE, String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: Math.floor(INACTIVITY_LIMIT_MS / 1000),
  })
  return response
}

const clearAuthCookies = (request: NextRequest, response: NextResponse) => {
  const secure = request.nextUrl.protocol === 'https:'
  const baseOptions = { path: '/', maxAge: 0, secure }
  response.cookies.set(LAST_ACTIVITY_COOKIE, '', baseOptions)
  response.cookies.set('next-auth.session-token', '', baseOptions)
  response.cookies.set('__Secure-next-auth.session-token', '', baseOptions)
  response.cookies.set('next-auth.csrf-token', '', baseOptions)
  response.cookies.set('__Host-next-auth.csrf-token', '', baseOptions)
  return response
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/api/auth',
    '/_next',
    '/favicon.ico',
  ]

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Allow public routes
  if (isPublicRoute) return NextResponse.next()

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(loginUrl)
    return clearAuthCookies(request, response)
  }

  const lastActivity = request.cookies.get(LAST_ACTIVITY_COOKIE)?.value
  if (lastActivity) {
    const lastActivityMs = Number(lastActivity)
    if (Number.isFinite(lastActivityMs) && Date.now() - lastActivityMs > INACTIVITY_LIMIT_MS) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('reason', 'inactive')
      const response = NextResponse.redirect(loginUrl)
      return clearAuthCookies(request, response)
    }
  }

  // Role-based restrictions
  const role = token?.user.role // assuming your JWT includes "role"

  // Routes restricted for admin
  const restrictedForAdmin = ['/payment-details', '/plan', '/subscriber']

  if (role === 'admin' && restrictedForAdmin.some((route) => pathname.startsWith(route))) {
    const homeUrl = new URL('/', request.url)
    return withActivityCookie(request, NextResponse.redirect(homeUrl))
  }

  // Super-admin has full access
  if (role === 'super-admin') {
    return withActivityCookie(request, NextResponse.next())
  }

  // Default allow
  return withActivityCookie(request, NextResponse.next())
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}