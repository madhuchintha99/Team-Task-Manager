import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export interface JWTPayload {
  userId: string
  role: 'admin' | 'member'
  iat?: number
  exp?: number
}

/**
 * Verifies the Bearer token from the Authorization header and returns the
 * decoded payload. Returns null if the token is missing or invalid.
 */
export function verifyToken(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

/**
 * Returns a 401 Unauthorized response.
 */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Returns a 403 Forbidden response.
 */
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
