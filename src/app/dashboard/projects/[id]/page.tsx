"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit, Trash2, Plus, CheckCircle, Circle, Clock, AlertCircle,
  Users, Calendar, DollarSign, ListTodo, Flag, MessageSquare
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  client: { id: string; name: string; email: string };
  manager: { id: string; name: string; email: string };
  tasks: Task[];
  milestones: Milestone[];
  timeEntries: TimeEntry[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  estimatedHours: number | null;
  assignee: { id: string; name: string } | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completed: boolean;
}

interface TimeEntry {
  id: string;
  hours: number;
  description: string | null;
  date: string;
  billable: boolean;
  user: { name: string };
  task: { title: string } | null;
}

interface User {
  id: string;
  name: string;
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "", description: "", assigneeId: "", status: "TODO", priority: "MEDIUM", dueDate: "", estimatedHours: ""
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: "", description: "", dueDate: ""
  });

  const [timeForm, setTimeForm] = useState({
    taskId: "", hours: "", description: "", date: new Date().toISOString().split("T")[0], billable: true
  });

  useEffect(() => {
    fetchProject();
    fetchUsers();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error("Project not found");
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      router.push("/dashboard/projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/projects/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm)
      });
      setShowTaskModal(false);
      setTaskForm({ title: "", description: "", assigneeId: "", status: "TODO", priority: "MEDIUM", dueDate: "", estimatedHours: "" });
      fetchProject();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      fetchProject();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/projects/${id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(milestoneForm)
      });
      setShowMilestoneModal(false);
      setMilestoneForm({ title: "", description: "", dueDate: "" });
      fetchProject();
    } catch (error) {
      console.error("Error adding milestone:", error);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      await fetch(`/api/milestones/${milestoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
      });
      fetchProject();
    } catch (error) {
      console.error("Error updating milestone:", error);
    }
  };

  const handleAddTimeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/projects/${id}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeForm)
      });
      setShowTimeModal(false);
      setTimeForm({ taskId: "", hours: "", description: "", date: new Date().toISOString().split("T")[0], billable: true });
      fetchProject();
    } catch (error) {
      console.error("Error adding time entry:", error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "HIGH": return <Flag className="w-4 h-4 text-orange-500" />;
      case "MEDIUM": return <Flag className="w-4 h-4 text-yellow-500" />;
      default: return <Flag className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) return null;

  const totalHours = project.timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const completedTasks = project.tasks.filter(t => t.status === "COMPLETED").length;
  const completedMilestones = project.milestones.filter(m => m.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/projects" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-gray-500">{project.client.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/projects/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ListTodo className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tasks</p>
              <p className="text-xl font-bold">{completedTasks}/{project.tasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Flag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Milestones</p>
              <p className="text-xl font-bold">{completedMilestones}/{project.milestones.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hours Logged</p>
              <p className="text-xl font-bold">{totalHours.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-xl font-bold">{project.budget ? `$${project.budget.toLocaleString()}` : "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {["tasks", "milestones", "time", "details"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "time" ? "Time Tracking" : tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "tasks" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Tasks ({project.tasks.length})</h3>
                <button
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>

              {project.tasks.length === 0 ? (
                <p className="text-gray-500">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateTask(task.id, {
                            status: task.status === "COMPLETED" ? "TODO" : "COMPLETED"
                          })}
                          className="text-gray-400 hover:text-primary-600"
                        >
                          {task.status === "COMPLETED"
                            ? <CheckCircle className="w-5 h-5 text-green-500" />
                            : <Circle className="w-5 h-5" />
                          }
                        </button>
                        <div>
                          <p className={`font-medium ${task.status === "COMPLETED" ? "line-through text-gray-400" : ""}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {task.assignee && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{task.assignee.name}</span>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPriorityIcon(task.priority)}
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "milestones" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Milestones ({project.milestones.length})</h3>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              </div>

              {project.milestones.length === 0 ? (
                <p className="text-gray-500">No milestones yet</p>
              ) : (
                <div className="space-y-2">
                  {project.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleMilestone(milestone.id, !milestone.completed)}
                          className="text-gray-400 hover:text-primary-600"
                        >
                          {milestone.completed
                            ? <CheckCircle className="w-5 h-5 text-green-500" />
                            : <Circle className="w-5 h-5" />
                          }
                        </button>
                        <div>
                          <p className={`font-medium ${milestone.completed ? "line-through text-gray-400" : ""}`}>
                            {milestone.title}
                          </p>
                          {milestone.description && (
                            <p className="text-sm text-gray-500">{milestone.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "time" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Time Entries</h3>
                <button
                  onClick={() => setShowTimeModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Log Time
                </button>
              </div>

              {project.timeEntries.length === 0 ? (
                <p className="text-gray-500">No time entries yet</p>
              ) : (
                <div className="space-y-2">
                  {project.timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{entry.description || "No description"}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span>{entry.user.name}</span>
                          {entry.task && <span>- {entry.task.title}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{entry.hours}h</p>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.date).toLocaleDateString()}
                          {entry.billable && <span className="ml-2 text-green-600">Billable</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Project Details</h3>
                {project.description && (
                  <p className="text-gray-600">{project.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"} -
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      Budget: {project.budget ? `$${project.budget.toLocaleString()}` : "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Team</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">{project.manager.name}</p>
                      <p className="text-sm text-gray-500">Project Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this project? This will also delete all tasks, milestones, and time entries.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task" size="lg">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Task</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title="Add Milestone">
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={milestoneForm.dueDate}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowMilestoneModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Milestone</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTimeModal} onClose={() => setShowTimeModal(false)} title="Log Time">
        <form onSubmit={handleAddTimeEntry} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task (Optional)</label>
            <select
              value={timeForm.taskId}
              onChange={(e) => setTimeForm({ ...timeForm, taskId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No specific task</option>
              {project.tasks.map((task) => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours *</label>
              <input
                type="number"
                required
                min="0.25"
                step="0.25"
                value={timeForm.hours}
                onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={timeForm.date}
                onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={timeForm.description}
              onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={timeForm.billable}
              onChange={(e) => setTimeForm({ ...timeForm, billable: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="billable" className="text-sm text-gray-700">Billable</label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowTimeModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Log Time</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
