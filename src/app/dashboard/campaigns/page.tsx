"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, TrendingUp, Edit, Trash2 } from "lucide-react";
import DataTable from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  budget: number | null;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  client: { name: string };
  manager: { name: string };
  _count: { channels: number; metrics: number; abTests: number };
}

export default function CampaignsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, [page, search, statusFilter, sortField, sortDirection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10", sortField, sortDirection, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const response = await fetch(`/api/campaigns?${params}`);
      const data = await response.json();
      setCampaigns(data.campaigns);
      setTotalPages(data.pagination.totalPages);
    } catch { addToast("error", "Failed to load campaigns"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      addToast("success", "Campaign deleted"); setShowDeleteConfirm(false); setShowDetailModal(false); setSelected(null); fetchData();
    } catch { addToast("error", "Failed to delete"); } finally { setDeleteLoading(false); }
  };

  const confirmBulkDelete = async () => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", entity: "campaigns", ids: selectedIds }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Deleted ${data.count} campaigns`); setSelectedIds([]); setShowBulkDeleteConfirm(false); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const handleBulkUpdate = async (ids: string[], updateData: Record<string, string>) => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", entity: "campaigns", ids, data: updateData }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Updated ${data.count} campaigns`); setSelectedIds([]); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const columns: Column<Campaign>[] = [
    { key: "name", label: "Campaign", sortable: true, render: (c) => (<div><p className="font-medium">{c.name}</p><p className="text-sm text-gray-500">{c.client.name}</p></div>), exportValue: (c) => c.name },
    { key: "type", label: "Type", sortable: true, render: (c) => <span className="text-sm capitalize">{c.type.toLowerCase().replace("_", " ")}</span>, exportValue: (c) => c.type },
    { key: "status", label: "Status", sortable: true, render: (c) => <StatusBadge status={c.status} />, exportValue: (c) => c.status },
    { key: "budget", label: "Budget / Spent", sortable: true, render: (c) => (<div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400" /><span>${c.spent.toLocaleString()} / {c.budget ? `$${c.budget.toLocaleString()}` : "-"}</span></div>), exportValue: (c) => `${c.spent}/${c.budget || 0}` },
    { key: "manager", label: "Manager", render: (c) => c.manager.name, exportValue: (c) => c.manager.name },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Campaigns</h1><p className="text-gray-500">Manage marketing campaigns</p></div>
        <Link href="/dashboard/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus className="w-4 h-4" />New Campaign</Link>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Status</option><option value="DRAFT">Draft</option><option value="SCHEDULED">Scheduled</option><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={campaigns} page={page} totalPages={totalPages} onPageChange={setPage}
          onRowClick={(c) => { setSelected(c); setShowDetailModal(true); }} loading={loading}
          sortField={sortField} sortDirection={sortDirection} onSort={(f, d) => { setSortField(f); setSortDirection(d); setPage(1); }}
          selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)} onBulkUpdate={handleBulkUpdate}
          bulkUpdateOptions={[{ label: "Status", field: "status", values: [{ label: "Draft", value: "DRAFT" }, { label: "Scheduled", value: "SCHEDULED" }, { label: "Active", value: "ACTIVE" }, { label: "Paused", value: "PAUSED" }, { label: "Completed", value: "COMPLETED" }] }]}
          exportFilename="campaigns" />
      </div>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelected(null); }} title="Campaign Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold">{selected.name}</h3><p className="text-sm text-gray-500">{selected.client.name}</p><div className="flex gap-2 mt-1"><StatusBadge status={selected.status} /><span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{selected.type}</span></div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push(`/dashboard/campaigns/${selected.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </div>
            {selected.description && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.description}</p>}
            <div className="grid grid-cols-2 gap-4">
              <p className="text-sm"><span className="text-gray-500">Manager:</span> {selected.manager.name}</p>
              <p className="text-sm"><span className="text-gray-500">Budget:</span> ${(selected.budget || 0).toLocaleString()}</p>
              <p className="text-sm"><span className="text-gray-500">Spent:</span> ${selected.spent.toLocaleString()}</p>
              <p className="text-sm"><span className="text-gray-500">Channels:</span> {selected._count.channels}</p>
              <p className="text-sm"><span className="text-gray-500">A/B Tests:</span> {selected._count.abTests}</p>
              {selected.startDate && <p className="text-sm"><span className="text-gray-500">Start:</span> {new Date(selected.startDate).toLocaleDateString()}</p>}
            </div>
            <div className="flex justify-end pt-4 border-t"><button onClick={() => router.push(`/dashboard/campaigns/${selected.id}`)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">View Full Details &rarr;</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} onConfirm={confirmBulkDelete} title="Delete Selected" message={`Delete ${selectedIds.length} campaign(s)?`} confirmLabel="Delete All" variant="danger" />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => selected && handleDelete(selected.id)} title="Delete Campaign" message={`Delete ${selected?.name}?`} confirmLabel="Delete" variant="danger" loading={deleteLoading} />
    </div>
  );
}
