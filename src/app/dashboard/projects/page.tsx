"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Calendar } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface Project {
  id: string;
  name: string;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [page, search, statusFilter]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();
      setProjects(data.projects);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Project",
      render: (project: Project) => (
        <div>
          <p className="font-medium">{project.name}</p>
          <p className="text-sm text-gray-500">{project.client.name}</p>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (project: Project) => <StatusBadge status={project.status} />
    },
    {
      key: "manager",
      label: "Manager",
      render: (project: Project) => project.manager.name
    },
    {
      key: "tasks",
      label: "Tasks",
      render: (project: Project) => project._count.tasks
    },
    {
      key: "timeline",
      label: "Timeline",
      render: (project: Project) => (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {project.startDate
            ? new Date(project.startDate).toLocaleDateString()
            : "Not set"}
          {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
        </div>
      )
    },
    {
      key: "budget",
      label: "Budget",
      render: (project: Project) =>
        project.budget ? `$${project.budget.toLocaleString()}` : "-"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500">Manage your project portfolio</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none bg-white"
              >
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

        <DataTable
          columns={columns}
          data={projects}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(project) => router.push(`/dashboard/projects/${project.id}`)}
          loading={loading}
        />
      </div>
    </div>
  );
}
