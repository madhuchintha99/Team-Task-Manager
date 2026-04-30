import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const { name, email, password, role } = await request.json()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hashedPassword, role: role || 'member' })
    await user.save()

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '7d' })

    return NextResponse.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error: any) {
    console.error('Signup error:', error)
    // Handle duplicate key error
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
  }
}