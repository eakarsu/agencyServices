"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, TrendingUp } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface Campaign {
  id: string;
  name: string;
  status: string;
  type: string;
  budget: number | null;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  client: { name: string };
  manager: { name: string };
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, [page, search, statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });
      const response = await fetch(`/api/campaigns?${params}`);
      const data = await response.json();
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Campaign",
      render: (campaign: Campaign) => (
        <div>
          <p className="font-medium">{campaign.name}</p>
          <p className="text-sm text-gray-500">{campaign.client.name}</p>
        </div>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (campaign: Campaign) => (
        <span className="text-sm capitalize">{campaign.type.toLowerCase().replace("_", " ")}</span>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (campaign: Campaign) => <StatusBadge status={campaign.status} />
    },
    {
      key: "budget",
      label: "Budget / Spent",
      render: (campaign: Campaign) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span>
            ${campaign.spent.toLocaleString()} / {campaign.budget ? `$${campaign.budget.toLocaleString()}` : "-"}
          </span>
        </div>
      )
    },
    { key: "manager", label: "Manager", render: (c: Campaign) => c.manager.name }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500">Manage marketing campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={campaigns}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(c) => router.push(`/dashboard/campaigns/${c.id}`)}
          loading={loading}
        />
      </div>
    </div>
  );
}
