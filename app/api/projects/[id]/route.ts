import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import Task from '@/models/Task'
import { validateRequired, validationError } from '@/lib/validation'

type RouteContext = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await Project.findById(params.id).populate('owner members', 'name email')
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.owner._id.toString() === userId
    const isMember = project.members.some((m: { _id: { toString(): string } }) => m._id.toString() === userId)
    if (userRole !== 'admin' && !isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('GET /api/projects/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await Project.findById(params.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.owner.toString() === userId
    if (userRole !== 'admin' && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the project owner or admin can update' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, members } = body

    const errors = validateRequired(body, ['name'])
    if (errors.length > 0) return validationError(errors)

    project.name = name.trim()
    project.description = description?.trim() ?? project.description
    if (members !== undefined) project.members = members

    await project.save()
    await project.populate('owner members', 'name email')

    return NextResponse.json(project)
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await Project.findById(params.id)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const isOwner = project.owner.toString() === userId
    if (userRole !== 'admin' && !isOwner) {
      return NextResponse.json({ error: 'Forbidden: only the project owner or admin can delete' }, { status: 403 })
    }

    // Cascade-delete all tasks belonging to this project
    await Task.deleteMany({ project: params.id })
    await Project.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Project and its tasks deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
