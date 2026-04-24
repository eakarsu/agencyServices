"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Calendar, Edit, Trash2, DollarSign, Users } from "lucide-react";
import DataTable from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  client: { name: string };
  manager: { name: string };
  _count: { tasks: number; milestones: number };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [page, search, statusFilter, sortField, sortDirection]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(), limit: "10", sortField, sortDirection,
        ...(search && { search }), ...(statusFilter && { status: statusFilter })
      });
      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
    } catch { addToast("error", "Failed to load projects"); }
    finally { setLoading(false); }
  };

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortField(field); setSortDirection(direction); setPage(1);
  };

  const handleRowClick = (project: Project) => {
    setSelectedProject(project); setShowDetailModal(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      addToast("success", "Project deleted successfully");
      setShowDeleteConfirm(false); setShowDetailModal(false); setSelectedProject(null);
      fetchProjects();
    } catch { addToast("error", "Failed to delete project"); }
    finally { setDeleteLoading(false); }
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch("/api/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", entity: "projects", ids: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      addToast("success", `Deleted ${data.count} projects`);
      setSelectedIds([]); setShowBulkDeleteConfirm(false); fetchProjects();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Bulk delete failed"); }
  };

  const handleBulkUpdate = async (ids: string[], updateData: Record<string, string>) => {
    try {
      const response = await fetch("/api/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", entity: "projects", ids, data: updateData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      addToast("success", `Updated ${data.count} projects`);
      setSelectedIds([]); fetchProjects();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Bulk update failed"); }
  };

  const columns: Column<Project>[] = [
    { key: "name", label: "Project", sortable: true, render: (p) => (<div><p className="font-medium">{p.name}</p><p className="text-sm text-gray-500">{p.client.name}</p></div>), exportValue: (p) => p.name },
    { key: "status", label: "Status", sortable: true, render: (p) => <StatusBadge status={p.status} />, exportValue: (p) => p.status },
    { key: "manager", label: "Manager", render: (p) => p.manager.name, exportValue: (p) => p.manager.name },
    { key: "tasks", label: "Tasks", render: (p) => p._count.tasks, exportValue: (p) => String(p._count.tasks) },
    { key: "timeline", label: "Timeline", render: (p) => (<div className="flex items-center gap-1 text-sm text-gray-500"><Calendar className="w-4 h-4" />{p.startDate ? new Date(p.startDate).toLocaleDateString() : "Not set"}{p.endDate && ` - ${new Date(p.endDate).toLocaleDateString()}`}</div>), exportValue: (p) => p.startDate ? new Date(p.startDate).toLocaleDateString() : "" },
    { key: "budget", label: "Budget", sortable: true, render: (p) => p.budget ? `$${p.budget.toLocaleString()}` : "-", exportValue: (p) => p.budget ? String(p.budget) : "" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Projects</h1><p className="text-gray-500">Manage your project portfolio</p></div>
        <Link href="/dashboard/projects/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus className="w-4 h-4" />New Project</Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search projects..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white">
                <option value="">All Status</option>
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={projects} page={page} totalPages={totalPages} onPageChange={setPage}
          onRowClick={handleRowClick} loading={loading} sortField={sortField} sortDirection={sortDirection} onSort={handleSort}
          selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)} onBulkUpdate={handleBulkUpdate}
          bulkUpdateOptions={[{ label: "Status", field: "status", values: [
            { label: "Planning", value: "PLANNING" }, { label: "In Progress", value: "IN_PROGRESS" },
            { label: "On Hold", value: "ON_HOLD" }, { label: "Completed", value: "COMPLETED" }, { label: "Cancelled", value: "CANCELLED" },
          ]}]} exportFilename="projects" />
      </div>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedProject(null); }} title="Project Details" size="lg">
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h3><p className="text-sm text-gray-500">{selectedProject.client.name}</p><StatusBadge status={selectedProject.status} /></div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push(`/dashboard/projects/${selectedProject.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </div>
            {selectedProject.description && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedProject.description}</p>}
            <div className="grid grid-cols-2 gap-4">
              <p className="text-sm"><span className="text-gray-500">Manager:</span> {selectedProject.manager.name}</p>
              <p className="text-sm"><span className="text-gray-500">Tasks:</span> {selectedProject._count.tasks}</p>
              <p className="text-sm"><span className="text-gray-500">Milestones:</span> {selectedProject._count.milestones}</p>
              {selectedProject.budget && <p className="text-sm"><span className="text-gray-500">Budget:</span> ${selectedProject.budget.toLocaleString()}</p>}
              {selectedProject.startDate && <p className="text-sm"><span className="text-gray-500">Start:</span> {new Date(selectedProject.startDate).toLocaleDateString()}</p>}
              {selectedProject.endDate && <p className="text-sm"><span className="text-gray-500">End:</span> {new Date(selectedProject.endDate).toLocaleDateString()}</p>}
            </div>
            <div className="flex justify-end pt-4 border-t">
              <button onClick={() => router.push(`/dashboard/projects/${selectedProject.id}`)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">View Full Details &rarr;</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} onConfirm={confirmBulkDelete}
        title="Delete Selected Projects" message={`Are you sure you want to delete ${selectedIds.length} project(s)?`} confirmLabel="Delete All" variant="danger" />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => selectedProject && handleDelete(selectedProject.id)}
        title="Delete Project" message={`Are you sure you want to delete ${selectedProject?.name}?`} confirmLabel="Delete" variant="danger" loading={deleteLoading} />
    </div>
  );
}
