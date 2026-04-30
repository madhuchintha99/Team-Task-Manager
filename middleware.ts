import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  userId: string
  role: string
}

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim()

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload

    // Clone the request headers and inject userId / userRole so API route
    // handlers can read them via request.headers.get(...)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('userId', decoded.userId)
    requestHeaders.set('userRole', decoded.role)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

export const config = {
  matcher: '/api/((?!auth).*)',
}