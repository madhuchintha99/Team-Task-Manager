'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  _id: string
  name: string
  email: string
}

interface Project {
  _id: string
  name: string
  description: string
  owner: Member
  members: Member[]
}

interface Task {
  _id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignedTo?: Member
  project: { _id: string; name: string }
  dueDate?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
      <div
        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter()

  // Data
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  // Filters & sort
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Create-project form
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })

  // Create-task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    project: '',
    assignedTo: '',
    dueDate: '',
  })

  // Edit-task modal
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
  })

  // Add-member modal
  const [memberProject, setMemberProject] = useState<Project | null>(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')

  // General UI state
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // ── Auth helpers ────────────────────────────────────────────────────────────

  const getToken = () => localStorage.getItem('token')

  const authHeaders = (extra: Record<string, string> = {}) => ({
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterPriority) params.set('priority', filterPriority)
    if (filterAssignee) params.set('assignedTo', filterAssignee)
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
    const res = await fetch(`/api/tasks?${params.toString()}`, {
      headers: authHeaders(),
    })
    if (res.ok) setTasks(await res.json())
  }, [filterStatus, filterPriority, filterAssignee, sortBy, sortOrder]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjects = useCallback(async () => {
    const token = getToken()
    if (!token) return
    const res = await fetch('/api/projects', { headers: authHeaders() })
    if (res.ok) setProjects(await res.json())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    // Decode JWT payload (no verification needed client-side — server validates)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setCurrentUserId(payload.userId)
      setCurrentUserRole(payload.role)
    } catch {
      router.push('/login')
      return
    }
    fetchProjects()
  }, [router, fetchProjects])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // ── Flash messages ──────────────────────────────────────────────────────────

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setTimeout(() => setError(''), 4000)
    } else {
      setSuccessMsg(msg)
      setTimeout(() => setSuccessMsg(''), 3000)
    }
  }

  // ── Create project ──────────────────────────────────────────────────────────

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(newProject),
    })
    if (res.ok) {
      setNewProject({ name: '', description: '' })
      setShowProjectForm(false)
      fetchProjects()
      flash('Project created!')
    } else {
      const data = await res.json()
      flash(data.error || 'Failed to create project', true)
    }
  }

  // ── Delete project ──────────────────────────────────────────────────────────

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Delete project "${project.name}" and ALL its tasks? This cannot be undone.`)) return
    const res = await fetch(`/api/projects/${project._id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) {
      fetchProjects()
      fetchTasks()
      flash('Project deleted.')
    } else {
      const data = await res.json()
      flash(data.error || 'Failed to delete project', true)
    }
  }

  // ── Add member ──────────────────────────────────────────────────────────────

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setMemberError('')
    if (!memberProject) return
    const res = await fetch(`/api/projects/${memberProject._id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ email: memberEmail }),
    })
    if (res.ok) {
      setMemberEmail('')
      setMemberProject(null)
      fetchProjects()
      flash('Member added!')
    } else {
      const data = await res.json()
      setMemberError(data.error || 'Failed to add member')
    }
  }

  // ── Create task ─────────────────────────────────────────────────────────────

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        ...newTask,
        assignedTo: newTask.assignedTo || undefined,
        dueDate: newTask.dueDate || undefined,
      }),
    })
    if (res.ok) {
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', project: '', assignedTo: '', dueDate: '' })
      setShowTaskForm(false)
      fetchTasks()
      flash('Task created!')
    } else {
      const data = await res.json()
      flash(data.error || 'Failed to create task', true)
    }
  }

  // ── Edit task ───────────────────────────────────────────────────────────────

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setEditTaskData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    })
  }

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTask) return
    const res = await fetch(`/api/tasks/${editingTask._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        ...editTaskData,
        assignedTo: editTaskData.assignedTo || null,
        dueDate: editTaskData.dueDate || null,
      }),
    })
    if (res.ok) {
      setEditingTask(null)
      fetchTasks()
      flash('Task updated!')
    } else {
      const data = await res.json()
      flash(data.error || 'Failed to update task', true)
    }
  }

  // ── Delete task ─────────────────────────────────────────────────────────────

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return
    const res = await fetch(`/api/tasks/${task._id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (res.ok) {
      fetchTasks()
      flash('Task deleted.')
    } else {
      const data = await res.json()
      flash(data.error || 'Failed to delete task', true)
    }
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()
  )

  const projectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.project._id === projectId || (t.project as unknown as string) === projectId)
    if (projectTasks.length === 0) return null
    const done = projectTasks.filter((t) => t.status === 'done').length
    return { done, total: projectTasks.length, pct: Math.round((done / projectTasks.length) * 100) }
  }

  // All unique assignees across visible tasks (for filter dropdown)
  const assigneeOptions = Array.from(
    new Map(
      tasks
        .filter((t) => t.assignedTo)
        .map((t) => [t.assignedTo!._id, t.assignedTo!])
    ).values()
  )

  // Members of the selected project (for task assignee dropdown)
  const selectedProjectMembers = (() => {
    const proj = projects.find((p) => p._id === newTask.project)
    if (!proj) return []
    return [proj.owner, ...proj.members.filter((m) => m._id !== proj.owner._id)]
  })()

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team Task Manager</h1>
        <div className="flex items-center gap-3">
          {currentUserRole === 'admin' && (
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
              Admin
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Flash messages ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {successMsg}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setShowProjectForm(!showProjectForm); setShowTaskForm(false) }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showProjectForm ? 'Cancel' : '+ New Project'}
          </button>
          <button
            onClick={() => { setShowTaskForm(!showTaskForm); setShowProjectForm(false) }}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showTaskForm ? 'Cancel' : '+ New Task'}
          </button>
        </div>

        {/* ── Create Project Form ── */}
        {showProjectForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <input
                type="text"
                placeholder="Project name *"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={2}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Create Project
              </button>
            </form>
          </div>
        )}

        {/* ── Create Task Form ── */}
        {showTaskForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <input
                type="text"
                placeholder="Task title *"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
              <textarea
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newTask.project}
                  onChange={(e) => setNewTask({ ...newTask, project: e.target.value, assignedTo: '' })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  required
                >
                  <option value="">Select project *</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                  disabled={!newTask.project}
                >
                  <option value="">Unassigned</option>
                  {selectedProjectMembers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Create Task
              </button>
            </form>
          </div>
        )}

        {/* ── Projects ── */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Projects</h2>
          {projects.length === 0 ? (
            <p className="text-gray-500 text-sm">No projects yet. Create one above.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => {
                const progress = projectProgress(project._id)
                const isOwner = project.owner._id === currentUserId
                const canManage = currentUserRole === 'admin' || isOwner
                return (
                  <div key={project._id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
                        )}
                      </div>
                      {canManage && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => { setMemberProject(project); setMemberEmail(''); setMemberError('') }}
                            title="Add member"
                            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md transition-colors"
                          >
                            + Member
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project)}
                            title="Delete project"
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500">
                      Owner: <span className="font-medium text-gray-700">{project.owner.name}</span>
                    </div>

                    {project.members.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Members:{' '}
                        <span className="font-medium text-gray-700">
                          {project.members.map((m) => m.name).join(', ')}
                        </span>
                      </div>
                    )}

                    {progress !== null && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{progress.done}/{progress.total} tasks done ({progress.pct}%)</span>
                        </div>
                        <ProgressBar value={progress.pct} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Tasks ── */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>

            {/* Filters & sort */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All statuses</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All assignees</option>
                {assigneeOptions.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split(':')
                  setSortBy(by)
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="dueDate:asc">Due date ↑</option>
                <option value="dueDate:desc">Due date ↓</option>
                <option value="priority:desc">Priority ↓</option>
              </select>
            </div>
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks match the current filters.</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isOverdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()
                return (
                  <div
                    key={task._id}
                    className={`bg-white border rounded-xl px-5 py-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{task.title}</span>
                        <Badge label={STATUS_LABELS[task.status] || task.status} colorClass={STATUS_COLORS[task.status] || ''} />
                        <Badge label={task.priority} colorClass={PRIORITY_COLORS[task.priority] || ''} />
                        {isOverdue && <Badge label="Overdue" colorClass="bg-red-100 text-red-700" />}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <span>Project: <span className="text-gray-700">{task.project.name}</span></span>
                        {task.assignedTo && (
                          <span>Assigned: <span className="text-gray-700">{task.assignedTo.name}</span></span>
                        )}
                        {task.dueDate && (
                          <span>Due: <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>{new Date(task.dueDate).toLocaleDateString()}</span></span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openEditTask(task)}
                        className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-md transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Overdue summary ── */}
        {overdueTasks.length > 0 && (
          <section className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-red-700 mb-3">
              ⚠ Overdue Tasks ({overdueTasks.length})
            </h2>
            <ul className="space-y-1">
              {overdueTasks.map((task) => (
                <li key={task._id} className="text-sm text-red-800 flex justify-between">
                  <span>{task.title}</span>
                  <span className="text-red-600">{new Date(task.dueDate!).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* ── Edit Task Modal ── */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Task</h2>
            <form onSubmit={handleUpdateTask} className="space-y-3">
              <input
                type="text"
                placeholder="Task title *"
                value={editTaskData.title}
                onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                required
              />
              <textarea
                placeholder="Description"
                value={editTaskData.description}
                onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                rows={2}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editTaskData.status}
                  onChange={(e) => setEditTaskData({ ...editTaskData, status: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <select
                  value={editTaskData.priority}
                  onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value })}
                  className="p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <select
                value={editTaskData.assignedTo}
                onChange={(e) => setEditTaskData({ ...editTaskData, assignedTo: e.target.value })}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">Unassigned</option>
                {(() => {
                  const proj = projects.find((p) => p._id === editingTask.project._id)
                  if (!proj) return null
                  return [proj.owner, ...proj.members.filter((m) => m._id !== proj.owner._id)].map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))
                })()}
              </select>
              <input
                type="date"
                value={editTaskData.dueDate}
                onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ── */}
      {memberProject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Member</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add a user to <span className="font-medium text-gray-700">{memberProject.name}</span> by their email address.
            </p>
            <form onSubmit={handleAddMember} className="space-y-3">
              <input
                type="email"
                placeholder="User email *"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                className="block w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
              {memberError && (
                <p className="text-xs text-red-600">{memberError}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => setMemberProject(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
