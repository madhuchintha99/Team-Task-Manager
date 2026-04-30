import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Project from '@/models/Project'
import User from '@/models/User'

type RouteContext = { params: { id: string } }

/**
 * POST /api/projects/:id/members
 * Body: { email: string }  — adds a user by email to the project's members list.
 * Only the project owner or an admin may add members.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
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
      return NextResponse.json(
        { error: 'Forbidden: only the project owner or admin can add members' },
        { status: 403 }
      )
    }

    const { email } = await request.json()
    if (!email || String(email).trim() === '') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() })
    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const alreadyMember = project.members.map((m: unknown) => String(m)).includes(String(userToAdd._id))
    if (alreadyMember) {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 409 })
    }

    project.members.push(userToAdd._id)
    await project.save()
    await project.populate('owner members', 'name email')

    return NextResponse.json(project)
  } catch (error) {
    console.error('POST /api/projects/[id]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/projects/:id/members
 * Body: { memberId: string }  — removes a member from the project.
 * Only the project owner or an admin may remove members.
 */
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
      return NextResponse.json(
        { error: 'Forbidden: only the project owner or admin can remove members' },
        { status: 403 }
      )
    }

    const { memberId } = await request.json()
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }

    project.members = project.members.filter((m: unknown) => String(m) !== String(memberId))
    await project.save()
    await project.populate('owner members', 'name email')

    return NextResponse.json(project)
  } catch (error) {
    console.error('DELETE /api/projects/[id]/members error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
