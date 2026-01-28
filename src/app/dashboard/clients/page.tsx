"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: string;
  createdAt: string;
  _count: { projects: number; invoices: number };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchClients();
  }, [page, search, statusFilter]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/clients?${params}`);
      const data = await response.json();
      setClients(data.clients);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (client: Client) => (
        <div>
          <p className="font-medium">{client.name}</p>
          <p className="text-sm text-gray-500">{client.email}</p>
        </div>
      )
    },
    { key: "company", label: "Company" },
    {
      key: "status",
      label: "Status",
      render: (client: Client) => <StatusBadge status={client.status} />
    },
    {
      key: "projects",
      label: "Projects",
      render: (client: Client) => client._count.projects
    },
    {
      key: "invoices",
      label: "Invoices",
      render: (client: Client) => client._count.invoices
    },
    {
      key: "createdAt",
      label: "Created",
      render: (client: Client) => new Date(client.createdAt).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500">Manage your client relationships</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients..."
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PROSPECT">Prospect</option>
                <option value="CHURNED">Churned</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={clients}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(client) => router.push(`/dashboard/clients/${client.id}`)}
          loading={loading}
        />
      </div>
    </div>
  );
}
