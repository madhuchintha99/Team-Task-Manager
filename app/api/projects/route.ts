import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    let projects
    if (userRole === 'admin') {
      projects = await Project.find().populate('owner members', 'name email')
    } else {
      projects = await Project.find({ $or: [{ owner: userId }, { members: userId }] }).populate('owner members', 'name email')
    }

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const { name, description, members } = await request.json()

    const project = new Project({ name, description, owner: userId, members: members || [] })
    await project.save()

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}