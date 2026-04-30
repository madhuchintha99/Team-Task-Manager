'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Project {
  _id: string
  name: string
  description: string
  owner: { name: string }
  members: { name: string }[]
}

interface Task {
  _id: string
  title: string
  status: string
  priority: string
  assignedTo?: { name: string }
  project: { name: string }
  dueDate?: string
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium', project: '', dueDate: '' })
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (tasksRes.ok) setTasks(await tasksRes.json())
    }

    fetchData()
  }, [router])

  const overdueTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date())

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newProject)
    })
    if (res.ok) {
      setNewProject({ name: '', description: '' })
      setShowProjectForm(false)
      // Refresh projects
      const projectsRes = await fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      if (projectsRes.ok) setProjects(await projectsRes.json())
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...newTask, dueDate: newTask.dueDate || undefined })
    })
    if (res.ok) {
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', project: '', dueDate: '' })
      setShowTaskForm(false)
      // Refresh tasks
      const tasksRes = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      if (tasksRes.ok) setTasks(await tasksRes.json())
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="mb-6">
        <button onClick={() => setShowProjectForm(!showProjectForm)} className="bg-green-500 text-white px-4 py-2 rounded mr-4">
          {showProjectForm ? 'Cancel' : 'Create Project'}
        </button>
        <button onClick={() => setShowTaskForm(!showTaskForm)} className="bg-blue-500 text-white px-4 py-2 rounded">
          {showTaskForm ? 'Cancel' : 'Create Task'}
        </button>
      </div>

      {showProjectForm && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject}>
            <input
              type="text"
              placeholder="Project Name"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
              required
            />
            <textarea
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
            />
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Create Project</button>
          </form>
        </div>
      )}

      {showTaskForm && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
          <form onSubmit={handleCreateTask}>
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
              required
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
            />
            <select
              value={newTask.project}
              onChange={(e) => setNewTask({ ...newTask, project: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
              required
            >
              <option value="">Select Project</option>
              {projects.map(project => (
                <option key={project._id} value={project._id}>{project.name}</option>
              ))}
            </select>
            <select
              value={newTask.status}
              onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="block w-full mb-2 p-2 border rounded"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create Task</button>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          {projects.map(project => (
            <div key={project._id} className="mb-2 p-2 border rounded">
              <h3 className="font-medium">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
              <p className="text-sm">Owner: {project.owner.name}</p>
            </div>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Tasks</h2>
          {tasks.map(task => (
            <div key={task._id} className="mb-2 p-2 border rounded">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm">Status: {task.status}</p>
              <p className="text-sm">Priority: {task.priority}</p>
              <p className="text-sm">Project: {task.project.name}</p>
              {task.assignedTo && <p className="text-sm">Assigned to: {task.assignedTo.name}</p>}
              {task.dueDate && <p className="text-sm">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Overdue Tasks</h2>
        {overdueTasks.map(task => (
          <div key={task._id} className="mb-2 p-2 border rounded bg-red-100">
            <h3 className="font-medium">{task.title}</h3>
            <p className="text-sm">Due: {new Date(task.dueDate!).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}