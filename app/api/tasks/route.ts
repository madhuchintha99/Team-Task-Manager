import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Task from '@/models/Task'
import Project from '@/models/Project'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const userRole = request.headers.get('userRole')

    let projects
    if (userRole === 'admin') {
      projects = await Project.find()
    } else {
      projects = await Project.find({ $or: [{ owner: userId }, { members: userId }] })
    }

    const projectIds = projects.map(p => p._id)
    const tasks = await Task.find({ project: { $in: projectIds } }).populate('assignedTo', 'name email').populate('project', 'name')

    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const userId = request.headers.get('userId')
    const { title, description, status, priority, assignedTo, project, dueDate } = await request.json()

    // Check if user has access to the project
    const proj = await Project.findById(project)
    if (!proj || (proj.owner.toString() !== userId && !proj.members.includes(userId))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const task = new Task({ title, description, status, priority, assignedTo, project, dueDate })
    await task.save()

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}