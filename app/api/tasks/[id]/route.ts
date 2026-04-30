import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Task from '@/models/Task'
import Project from '@/models/Project'
import {
  validateEnum,
  validationError,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@/lib/validation'

type RouteContext = { params: { id: string } }

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await Task.findById(params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name owner members')

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify the user has access to the project this task belongs to
    const proj = task.project as { owner: { toString(): string }; members: { toString(): string }[] }
    const isOwner = proj.owner.toString() === userId
    const isMember = proj.members.map((m) => m.toString()).includes(userId)
    if (userRole !== 'admin' && !isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('GET /api/tasks/[id] error:', error)
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

    const task = await Task.findById(params.id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify the user has access to the project this task belongs to
    const proj = await Project.findById(task.project)
    if (!proj) {
      return NextResponse.json({ error: 'Associated project not found' }, { status: 404 })
    }
    const isOwner = proj.owner.toString() === userId
    const isMember = proj.members.map((m: unknown) => String(m)).includes(userId)
    if (userRole !== 'admin' && !isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, status, priority, assignedTo, dueDate } = body

    const errors: ReturnType<typeof validateEnum>[] = []
    const statusErr = validateEnum(status, [...TASK_STATUSES], 'status')
    const priorityErr = validateEnum(priority, [...TASK_PRIORITIES], 'priority')
    if (statusErr) errors.push(statusErr)
    if (priorityErr) errors.push(priorityErr)
    if (errors.filter(Boolean).length > 0) return validationError(errors.filter(Boolean) as NonNullable<typeof statusErr>[])

    if (title !== undefined) task.title = title.trim()
    if (description !== undefined) task.description = description.trim()
    if (status !== undefined) task.status = status
    if (priority !== undefined) task.priority = priority
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null
    if (dueDate !== undefined) task.dueDate = dueDate || null

    await task.save()
    await task.populate('assignedTo', 'name email')
    await task.populate('project', 'name')

    return NextResponse.json(task)
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error)
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

    const task = await Task.findById(params.id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Only project owner, admin, or the assigned user may delete a task
    const proj = await Project.findById(task.project)
    if (!proj) {
      return NextResponse.json({ error: 'Associated project not found' }, { status: 404 })
    }
    const isProjectOwner = proj.owner.toString() === userId
    const isAssignee = task.assignedTo?.toString() === userId
    if (userRole !== 'admin' && !isProjectOwner && !isAssignee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await Task.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
