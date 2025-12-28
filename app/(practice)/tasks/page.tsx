'use client'

import { useState, useMemo } from 'react'
import { useData } from '@/store'
import { List, Grid3X3, Plus, Search, Filter, Calendar, User, Clock, CheckCircle, Circle, AlertCircle, X, Edit } from 'lucide-react'

interface Task {
  id: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'completed' | 'deferred'
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  patientId?: string
  dueDate?: string
  createdAt: string
  completedAt?: string
}

const DEMO_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Follow up on Amelia Ali lab results',
    description: 'HbA1c results came back elevated - need to schedule follow-up appointment',
    status: 'open',
    priority: 'high',
    assignedTo: 'Dr Patel',
    patientId: 'p1',
    dueDate: '2024-09-15',
    createdAt: '2024-09-12T09:00:00Z'
  },
  {
    id: 'task-2', 
    title: 'Insurance pre-authorization for Mrs Smith',
    description: 'Need to get AXA approval for proposed treatment plan',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'Reception',
    patientId: 'p3',
    dueDate: '2024-09-16',
    createdAt: '2024-09-11T14:30:00Z'
  },
  {
    id: 'task-3',
    title: 'Send treatment summary to Sarah Jones',
    description: 'Patient requested copy of consultation notes and treatment plan',
    status: 'completed',
    priority: 'low',
    assignedTo: 'Nurse Lee',
    patientId: 'p2',
    dueDate: '2024-09-13',
    createdAt: '2024-09-10T11:15:00Z',
    completedAt: '2024-09-13T16:20:00Z'
  },
  {
    id: 'task-4',
    title: 'Update emergency contact details',
    description: 'Review and update emergency contacts for all patients over 65',
    status: 'deferred',
    priority: 'low',
    assignedTo: 'Admin',
    dueDate: '2024-09-30',
    createdAt: '2024-09-08T10:00:00Z'
  },
  {
    id: 'task-5',
    title: 'Equipment maintenance check',
    description: 'Monthly safety check on blood pressure monitors and scales',
    status: 'open',
    priority: 'medium',
    assignedTo: 'Nurse Lee',
    dueDate: '2024-09-20',
    createdAt: '2024-09-12T08:00:00Z'
  }
]

export default function Tasks() {
  const { patients, tasks, addTask, completeTask, removeTask } = useData() as any
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Merge demo tasks with store tasks for richer experience
  const allTasks = useMemo(() => {
    const storeTasks = (tasks || []).map((t: any) => ({
      ...t,
      status: t.status === 'done' ? 'completed' : 'open',
      priority: 'medium',
      assignedTo: 'Staff',
      createdAt: new Date().toISOString()
    }))
    return [...DEMO_TASKS, ...storeTasks]
  }, [tasks])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = allTasks

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        getPatientName(task.patientId)?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Assignee filter  
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task => task.assignedTo === assigneeFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    return filtered.sort((a, b) => {
      // Sort by priority (high first), then by due date
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [allTasks, searchQuery, statusFilter, assigneeFilter, priorityFilter])

  // Get unique assignees
  const assignees = useMemo(() => {
    const unique = Array.from(new Set(allTasks.map(t => t.assignedTo).filter(Boolean)))
    return unique
  }, [allTasks])

  function getPatientName(patientId?: string) {
    if (!patientId) return null
    return patients.find((p: any) => p.id === patientId)?.name || patientId
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />
      case 'deferred': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default: return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'  
      case 'deferred': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function isOverdue(dueDate?: string) {
    if (!dueDate) return false
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  function updateTaskStatus(taskId: string, newStatus: string) {
    if (newStatus === 'completed') {
      completeTask(taskId)
    }
    // In real app, would have updateTask action
  }

  function createTask(taskData: Partial<Task>) {
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskData.title || 'New Task',
      status: 'open' as const,
      ...taskData
    }
    addTask(newTask)
    setIsCreating(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-2 text-sm ${viewMode === 'board' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Assignee</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Assignees</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Total Tasks</h3>
          <p className="text-2xl font-bold text-gray-900">{allTasks.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Open Tasks</h3>
          <p className="text-2xl font-bold text-orange-600">
            {allTasks.filter(t => t.status === 'open').length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600">
            {allTasks.filter(t => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Completed</h3>
          <p className="text-2xl font-bold text-green-600">
            {allTasks.filter(t => t.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Task Content */}
      {viewMode === 'list' ? (
        <TaskListView 
          tasks={filteredTasks}
          getPatientName={getPatientName}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          isOverdue={isOverdue}
          onUpdateStatus={updateTaskStatus}
          onEdit={setEditingTask}
          onDelete={removeTask}
        />
      ) : (
        <TaskBoardView
          tasks={filteredTasks}
          getPatientName={getPatientName}
          getPriorityColor={getPriorityColor}
          isOverdue={isOverdue}
          onUpdateStatus={updateTaskStatus}
          onEdit={setEditingTask}
        />
      )}

      {/* Task Creator Modal */}
      {isCreating && (
        <TaskEditorModal
          task={null}
          patients={patients}
          assignees={assignees}
          onSave={createTask}
          onClose={() => setIsCreating(false)}
        />
      )}

      {/* Task Editor Modal */}
      {editingTask && (
        <TaskEditorModal
          task={editingTask}
          patients={patients}
          assignees={assignees}
          onSave={(data) => {
            // In real app would update task
            setEditingTask(null)
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

// Task List View Component
function TaskListView({ tasks, getPatientName, getStatusIcon, getStatusColor, getPriorityColor, isOverdue, onUpdateStatus, onEdit, onDelete }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-500">
          <div className="col-span-2">Task</div>
          <div>Status</div>
          <div>Priority</div>
          <div>Assignee</div>
          <div>Due Date</div>
          <div>Actions</div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {tasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No tasks found matching your filters
          </div>
        ) : (
          tasks.map((task: Task) => (
            <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="grid grid-cols-7 gap-4 text-sm">
                <div className="col-span-2">
                  <div className="flex items-start space-x-2">
                    <div className="mt-1">{getStatusIcon(task.status)}</div>
                    <div>
                      <div className="font-medium text-gray-900">{task.title}</div>
                      {task.description && (
                        <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                      {task.patientId && (
                        <div className="text-blue-600 text-xs mt-1">
                          Patient: {getPatientName(task.patientId)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="text-gray-600">{task.assignedTo}</div>
                <div className={`text-sm ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB') : '-'}
                  {isOverdue(task.dueDate) && <div className="text-xs">Overdue</div>}
                </div>
                <div className="flex items-center space-x-2">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => onUpdateStatus(task.id, 'completed')}
                      className="text-green-600 hover:text-green-800"
                      title="Mark complete"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(task)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit task"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete task"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Task Board View Component  
function TaskBoardView({ tasks, getPatientName, getPriorityColor, isOverdue, onUpdateStatus, onEdit }: any) {
  const columns = [
    { id: 'open', title: 'Open', status: 'open' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress' },
    { id: 'completed', title: 'Completed', status: 'completed' },
    { id: 'deferred', title: 'Deferred', status: 'deferred' }
  ]

  const getColumnTasks = (status: string) => tasks.filter((t: Task) => t.status === status)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {columns.map(column => {
        const columnTasks = getColumnTasks(column.status)
        return (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">{column.title}</h3>
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm cursor-pointer"
                  onClick={() => onEdit(task)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                      {task.title}
                    </h4>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-gray-600 text-xs mb-3 line-clamp-3">
                      {task.description}
                    </p>
                  )}
                  <div className="space-y-1">
                    {task.patientId && (
                      <div className="text-blue-600 text-xs">
                        Patient: {getPatientName(task.patientId)}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{task.assignedTo}</span>
                      {task.dueDate && (
                        <span className={isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {new Date(task.dueDate).toLocaleDateString('en-GB')}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.status !== 'completed' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateStatus(task.id, 'completed')
                        }}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Task Editor Modal
function TaskEditorModal({ task, patients, assignees, onSave, onClose }: {
  task: Task | null
  patients: any[]
  assignees: string[]
  onSave: (task: Partial<Task>) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'open',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo || '',
    patientId: task?.patientId || '',
    dueDate: task?.dueDate || ''
  })

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Task Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Enter task title..."
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Task description..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'open' | 'in_progress' | 'completed' | 'deferred' }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Assign to</label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {assignees.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Link to Patient</label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData(prev => ({ ...prev, patientId: e.target.value }))}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">No patient linked</option>
              {patients.map((patient: any) => (
                <option key={patient.id} value={patient.id}>{patient.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.title}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  )
}
