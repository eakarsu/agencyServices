"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, TrendingUp } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  source: string;
  status: string;
  score: number;
  assignedTo: { name: string } | null;
  _count: { followUps: number };
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchLeads();
  }, [page, search, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });
      const response = await fetch(`/api/leads?${params}`);
      const data = await response.json();
      setLeads(data.leads);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const columns = [
    {
      key: "name",
      label: "Lead",
      render: (lead: Lead) => (
        <div>
          <p className="font-medium">{lead.firstName} {lead.lastName}</p>
          <p className="text-sm text-gray-500">{lead.email}</p>
        </div>
      )
    },
    { key: "company", label: "Company", render: (lead: Lead) => lead.company || "-" },
    { key: "source", label: "Source", render: (lead: Lead) => <span className="text-sm capitalize">{lead.source.toLowerCase().replace("_", " ")}</span> },
    { key: "status", label: "Status", render: (lead: Lead) => <StatusBadge status={lead.status} /> },
    {
      key: "score",
      label: "Score",
      render: (lead: Lead) => (
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${getScoreColor(lead.score)}`} />
          <span className={`font-medium ${getScoreColor(lead.score)}`}>{lead.score}</span>
        </div>
      )
    },
    { key: "assignedTo", label: "Assigned To", render: (lead: Lead) => lead.assignedTo?.name || "-" },
    { key: "followUps", label: "Follow-ups", render: (lead: Lead) => lead._count.followUps }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">Manage your lead pipeline</p>
        </div>
        <Link href="/dashboard/leads/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          <Plus className="w-4 h-4" />Add Lead
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search leads..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="UNQUALIFIED">Unqualified</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={leads} page={page} totalPages={totalPages}
          onPageChange={setPage} onRowClick={(lead) => router.push(`/dashboard/leads/${lead.id}`)} loading={loading} />
      </div>
    </div>
  );
}
