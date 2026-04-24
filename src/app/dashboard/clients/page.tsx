"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Edit, Trash2, Mail, Phone, Building, MapPin, ArrowLeft, X } from "lucide-react";
import DataTable from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  address: string | null;
  industry: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  _count: { projects: number; invoices: number };
}

export default function ClientsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, [page, search, statusFilter, sortField, sortDirection]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortField,
        sortDirection,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/clients?${params}`);
      const data = await response.json();
      setClients(data.clients);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching clients:", error);
      addToast("error", "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string, direction: "asc" | "desc") => {
    setSortField(field);
    setSortDirection(direction);
    setPage(1);
  };

  const handleRowClick = (client: Client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      addToast("success", "Client deleted successfully");
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
      setSelectedClient(null);
      fetchClients();
    } catch {
      addToast("error", "Failed to delete client");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", entity: "clients", ids: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      addToast("success", `Deleted ${data.count} clients`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchClients();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Bulk delete failed");
    }
  };

  const handleBulkUpdate = async (ids: string[], updateData: Record<string, string>) => {
    try {
      const response = await fetch("/api/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", entity: "clients", ids, data: updateData }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      addToast("success", `Updated ${data.count} clients`);
      setSelectedIds([]);
      fetchClients();
    } catch (err) {
      addToast("error", err instanceof Error ? err.message : "Bulk update failed");
    }
  };

  const columns: Column<Client>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (client: Client) => (
        <div>
          <p className="font-medium">{client.name}</p>
          <p className="text-sm text-gray-500">{client.email}</p>
        </div>
      ),
      exportValue: (client: Client) => client.name,
    },
    { key: "company", label: "Company", sortable: true, exportValue: (c) => c.company || "" },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (client: Client) => <StatusBadge status={client.status} />,
      exportValue: (c) => c.status,
    },
    {
      key: "projects",
      label: "Projects",
      render: (client: Client) => client._count.projects,
      exportValue: (c) => String(c._count.projects),
    },
    {
      key: "invoices",
      label: "Invoices",
      render: (client: Client) => client._count.invoices,
      exportValue: (c) => String(c._count.invoices),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (client: Client) => new Date(client.createdAt).toLocaleDateString(),
      exportValue: (c) => new Date(c.createdAt).toLocaleDateString(),
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
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
          onRowClick={handleRowClick}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          onBulkUpdate={handleBulkUpdate}
          bulkUpdateOptions={[
            {
              label: "Status",
              field: "status",
              values: [
                { label: "Active", value: "ACTIVE" },
                { label: "Inactive", value: "INACTIVE" },
                { label: "Prospect", value: "PROSPECT" },
                { label: "Churned", value: "CHURNED" },
              ],
            },
          ]}
          exportFilename="clients"
        />
      </div>

      {/* Row Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedClient(null); }} title="Client Details" size="lg">
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedClient.name}</h3>
                <StatusBadge status={selectedClient.status} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/dashboard/clients/${selectedClient.id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selectedClient.email}</span>
                </div>
                {selectedClient.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedClient.phone}</span>
                  </div>
                )}
                {selectedClient.company && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{selectedClient.company}</span>
                  </div>
                )}
                {selectedClient.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedClient.address}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {selectedClient.industry && (
                  <p className="text-sm"><span className="text-gray-500">Industry:</span> {selectedClient.industry}</p>
                )}
                <p className="text-sm"><span className="text-gray-500">Projects:</span> {selectedClient._count.projects}</p>
                <p className="text-sm"><span className="text-gray-500">Invoices:</span> {selectedClient._count.invoices}</p>
                <p className="text-sm"><span className="text-gray-500">Created:</span> {new Date(selectedClient.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedClient.notes && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedClient.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => router.push(`/dashboard/clients/${selectedClient.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                View Full Details &rarr;
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Clients"
        message={`Are you sure you want to delete ${selectedIds.length} client(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        variant="danger"
      />

      {/* Single Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => selectedClient && handleDelete(selectedClient.id)}
        title="Delete Client"
        message={`Are you sure you want to delete ${selectedClient?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
