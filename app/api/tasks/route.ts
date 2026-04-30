import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Task from '@/models/Task'
import Project from '@/models/Project'
import {
  validateRequired,
  validateEnum,
  validationError,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const priorityFilter = searchParams.get('priority')
    const assigneeFilter = searchParams.get('assignedTo')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    let accessibleProjects
    if (userRole === 'admin') {
      accessibleProjects = await Project.find()
    } else {
      accessibleProjects = await Project.find({
        $or: [{ owner: userId }, { members: userId }],
      })
    }

    const projectIds = accessibleProjects.map((p) => p._id)

    const taskQuery: Record<string, unknown> = { project: { $in: projectIds } }
    if (statusFilter) taskQuery.status = statusFilter
    if (priorityFilter) taskQuery.priority = priorityFilter
    if (assigneeFilter) taskQuery.assignedTo = assigneeFilter

    const tasks = await Task.find(taskQuery)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort({ [sortBy]: sortOrder })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET /api/tasks error:', error)
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
    const { title, description, status, priority, assignedTo, project, dueDate } = body

    const errors = validateRequired(body, ['title', 'project'])
    const statusErr = validateEnum(status, [...TASK_STATUSES], 'status')
    const priorityErr = validateEnum(priority, [...TASK_PRIORITIES], 'priority')
    if (statusErr) errors.push(statusErr)
    if (priorityErr) errors.push(priorityErr)
    if (errors.length > 0) return validationError(errors)

    // Verify the user has access to the project
    const proj = await Project.findById(project)
    if (!proj) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    const isOwner = proj.owner.toString() === userId
    const isMember = proj.members.map((m: unknown) => String(m)).includes(userId)
    if (!isOwner && !isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const task = new Task({
      title: title.trim(),
      description: description?.trim(),
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || undefined,
      project,
      dueDate: dueDate || undefined,
    })
    await task.save()
    await task.populate('assignedTo', 'name email')
    await task.populate('project', 'name')

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
