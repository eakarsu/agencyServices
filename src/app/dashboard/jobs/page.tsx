"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Filter, Briefcase } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface Job {
  id: string;
  title: string;
  type: string;
  status: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  _count: {
    applications: number;
    placements: number;
  };
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, typeFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter })
      });
      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Job Title",
      render: (job: Job) => (
        <div>
          <p className="font-medium">{job.title}</p>
          <p className="text-sm text-gray-500">{job.location || "Remote"}</p>
        </div>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (job: Job) => (
        <span className="capitalize">{job.type.toLowerCase().replace("_", " ")}</span>
      )
    },
    { key: "status", label: "Status", render: (job: Job) => <StatusBadge status={job.status} /> },
    {
      key: "salary",
      label: "Salary Range",
      render: (job: Job) => {
        if (!job.salaryMin && !job.salaryMax) return <span className="text-gray-400">Not specified</span>;
        if (job.salaryMin && job.salaryMax) {
          return <span>${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}</span>;
        }
        return <span>${(job.salaryMin || job.salaryMax)?.toLocaleString()}</span>;
      }
    },
    {
      key: "applications",
      label: "Applications",
      render: (job: Job) => <span>{job._count.applications}</span>
    },
    {
      key: "placements",
      label: "Placements",
      render: (job: Job) => <span>{job._count.placements}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Positions</h1>
          <p className="text-gray-500">Manage open job positions and track applications</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
              >
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="TEMPORARY">Temporary</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={jobs}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(job) => router.push(`/dashboard/jobs/${job.id}`)}
          loading={loading}
        />
      </div>
    </div>
  );
}
