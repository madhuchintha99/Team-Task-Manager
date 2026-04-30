import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import { validateRequired, validationError } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let projects
    if (userRole === 'admin') {
      projects = await Project.find().populate('owner members', 'name email')
    } else {
      projects = await Project.find({
        $or: [{ owner: userId }, { members: userId }],
      }).populate('owner members', 'name email')
    }

    return NextResponse.json(projects)
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, members } = body

    const errors = validateRequired(body, ['name'])
    if (errors.length > 0) return validationError(errors)

    const project = new Project({
      name: name.trim(),
      description: description?.trim(),
      owner: userId,
      members: members || [],
    })
    await project.save()
    await project.populate('owner members', 'name email')

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
