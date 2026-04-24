"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, TrendingUp, Edit, Trash2, Mail, Phone, Building } from "lucide-react";
import DataTable from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  title: string | null;
  source: string;
  status: string;
  score: number;
  notes: string | null;
  assignedTo: { name: string } | null;
  _count: { followUps: number };
}

export default function LeadsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
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
  const [selected, setSelected] = useState<Lead | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, [page, search, statusFilter, sortField, sortDirection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10", sortField, sortDirection, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const response = await fetch(`/api/leads?${params}`);
      const data = await response.json();
      setLeads(data.leads);
      setTotalPages(data.pagination.totalPages);
    } catch { addToast("error", "Failed to load leads"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      addToast("success", "Lead deleted"); setShowDeleteConfirm(false); setShowDetailModal(false); setSelected(null); fetchData();
    } catch { addToast("error", "Failed to delete"); } finally { setDeleteLoading(false); }
  };

  const confirmBulkDelete = async () => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", entity: "leads", ids: selectedIds }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Deleted ${data.count} leads`); setSelectedIds([]); setShowBulkDeleteConfirm(false); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const handleBulkUpdate = async (ids: string[], updateData: Record<string, string>) => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", entity: "leads", ids, data: updateData }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Updated ${data.count} leads`); setSelectedIds([]); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const columns: Column<Lead>[] = [
    { key: "name", label: "Lead", sortable: true, render: (l) => (<div><p className="font-medium">{l.firstName} {l.lastName}</p><p className="text-sm text-gray-500">{l.email}</p></div>), exportValue: (l) => `${l.firstName} ${l.lastName}` },
    { key: "company", label: "Company", sortable: true, render: (l) => l.company || "-", exportValue: (l) => l.company || "" },
    { key: "source", label: "Source", sortable: true, render: (l) => <span className="text-sm capitalize">{l.source.toLowerCase().replace("_", " ")}</span>, exportValue: (l) => l.source },
    { key: "status", label: "Status", sortable: true, render: (l) => <StatusBadge status={l.status} />, exportValue: (l) => l.status },
    { key: "score", label: "Score", sortable: true, render: (l) => (<div className="flex items-center gap-2"><TrendingUp className={`w-4 h-4 ${getScoreColor(l.score)}`} /><span className={`font-medium ${getScoreColor(l.score)}`}>{l.score}</span></div>), exportValue: (l) => String(l.score) },
    { key: "assignedTo", label: "Assigned To", render: (l) => l.assignedTo?.name || "-", exportValue: (l) => l.assignedTo?.name || "" },
    { key: "followUps", label: "Follow-ups", render: (l) => l._count.followUps, exportValue: (l) => String(l._count.followUps) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Leads</h1><p className="text-gray-500">Manage your lead pipeline</p></div>
        <Link href="/dashboard/leads/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus className="w-4 h-4" />Add Lead</Link>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search leads..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Status</option><option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="QUALIFIED">Qualified</option><option value="UNQUALIFIED">Unqualified</option><option value="CONVERTED">Converted</option><option value="LOST">Lost</option>
              </select>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={leads} page={page} totalPages={totalPages} onPageChange={setPage}
          onRowClick={(l) => { setSelected(l); setShowDetailModal(true); }} loading={loading}
          sortField={sortField} sortDirection={sortDirection} onSort={(f, d) => { setSortField(f); setSortDirection(d); setPage(1); }}
          selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)} onBulkUpdate={handleBulkUpdate}
          bulkUpdateOptions={[{ label: "Status", field: "status", values: [{ label: "New", value: "NEW" }, { label: "Contacted", value: "CONTACTED" }, { label: "Qualified", value: "QUALIFIED" }, { label: "Unqualified", value: "UNQUALIFIED" }, { label: "Converted", value: "CONVERTED" }, { label: "Lost", value: "LOST" }] }]}
          exportFilename="leads" />
      </div>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelected(null); }} title="Lead Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold">{selected.firstName} {selected.lastName}</h3>{selected.title && <p className="text-sm text-gray-500">{selected.title}</p>}<StatusBadge status={selected.status} /></div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push(`/dashboard/leads/${selected.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{selected.email}</span></div>
                {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{selected.phone}</span></div>}
                {selected.company && <div className="flex items-center gap-2 text-sm"><Building className="w-4 h-4 text-gray-400" /><span>{selected.company}</span></div>}
              </div>
              <div className="space-y-3">
                <p className="text-sm"><span className="text-gray-500">Source:</span> <span className="capitalize">{selected.source.toLowerCase().replace("_", " ")}</span></p>
                <p className="text-sm"><span className="text-gray-500">Score:</span> <span className={`font-medium ${getScoreColor(selected.score)}`}>{selected.score}</span></p>
                {selected.assignedTo && <p className="text-sm"><span className="text-gray-500">Assigned To:</span> {selected.assignedTo.name}</p>}
                <p className="text-sm"><span className="text-gray-500">Follow-ups:</span> {selected._count.followUps}</p>
              </div>
            </div>
            {selected.notes && <div><p className="text-sm font-medium text-gray-700 mb-1">Notes</p><p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.notes}</p></div>}
            <div className="flex justify-end pt-4 border-t"><button onClick={() => router.push(`/dashboard/leads/${selected.id}`)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">View Full Details &rarr;</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} onConfirm={confirmBulkDelete} title="Delete Selected" message={`Delete ${selectedIds.length} lead(s)?`} confirmLabel="Delete All" variant="danger" />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => selected && handleDelete(selected.id)} title="Delete Lead" message={`Delete ${selected?.firstName} ${selected?.lastName}?`} confirmLabel="Delete" variant="danger" loading={deleteLoading} />
    </div>
  );
}
