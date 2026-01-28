"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Star } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentTitle: string | null;
  currentCompany: string | null;
  status: string;
  score: number | null;
  experience: number | null;
  skills: string[];
  _count: { applications: number; interviews: number };
}

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, [page, search, statusFilter]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });
      const response = await fetch(`/api/candidates?${params}`);
      const data = await response.json();
      setCandidates(data.candidates);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Candidate",
      render: (c: Candidate) => (
        <div>
          <p className="font-medium">{c.firstName} {c.lastName}</p>
          <p className="text-sm text-gray-500">{c.email}</p>
        </div>
      )
    },
    {
      key: "current",
      label: "Current Role",
      render: (c: Candidate) => c.currentTitle ? (
        <div>
          <p className="text-sm">{c.currentTitle}</p>
          <p className="text-sm text-gray-500">{c.currentCompany}</p>
        </div>
      ) : "-"
    },
    {
      key: "status",
      label: "Status",
      render: (c: Candidate) => <StatusBadge status={c.status} />
    },
    {
      key: "score",
      label: "Score",
      render: (c: Candidate) => c.score ? (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span>{c.score.toFixed(1)}</span>
        </div>
      ) : "-"
    },
    {
      key: "experience",
      label: "Experience",
      render: (c: Candidate) => c.experience ? `${c.experience} years` : "-"
    },
    {
      key: "interviews",
      label: "Interviews",
      render: (c: Candidate) => c._count.interviews
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500">Manage your candidate pipeline</p>
        </div>
        <Link href="/dashboard/candidates/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus className="w-4 h-4" />Add Candidate
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search candidates..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="SCREENING">Screening</option>
                <option value="INTERVIEWING">Interviewing</option>
                <option value="OFFERED">Offered</option>
                <option value="PLACED">Placed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={candidates} page={page} totalPages={totalPages}
          onPageChange={setPage} onRowClick={(c) => router.push(`/dashboard/candidates/${c.id}`)} loading={loading} />
      </div>
    </div>
  );
}
