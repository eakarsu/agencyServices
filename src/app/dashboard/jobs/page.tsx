"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Briefcase, Edit, Trash2, MapPin, DollarSign } from "lucide-react";
import DataTable from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

interface Job {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  requirements: string[];
  skills: string[];
  createdAt: string;
  _count: { applications: number; placements: number };
}

export default function JobsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState<Job | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, [page, search, statusFilter, typeFilter, sortField, sortDirection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10", sortField, sortDirection, ...(search && { search }), ...(statusFilter && { status: statusFilter }), ...(typeFilter && { type: typeFilter }) });
      const response = await fetch(`/api/jobs?${params}`);
      const data = await response.json();
      setJobs(data.jobs);
      setTotalPages(data.pagination.totalPages);
    } catch { addToast("error", "Failed to load jobs"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      addToast("success", "Job deleted"); setShowDeleteConfirm(false); setShowDetailModal(false); setSelected(null); fetchData();
    } catch { addToast("error", "Failed to delete"); } finally { setDeleteLoading(false); }
  };

  const confirmBulkDelete = async () => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", entity: "jobs", ids: selectedIds }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Deleted ${data.count} jobs`); setSelectedIds([]); setShowBulkDeleteConfirm(false); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const handleBulkUpdate = async (ids: string[], updateData: Record<string, string>) => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", entity: "jobs", ids, data: updateData }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Updated ${data.count} jobs`); setSelectedIds([]); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const columns: Column<Job>[] = [
    { key: "title", label: "Job Title", sortable: true, render: (j) => (<div><p className="font-medium">{j.title}</p><p className="text-sm text-gray-500">{j.location || "Remote"}</p></div>), exportValue: (j) => j.title },
    { key: "type", label: "Type", sortable: true, render: (j) => <span className="capitalize">{j.type.toLowerCase().replace("_", " ")}</span>, exportValue: (j) => j.type },
    { key: "status", label: "Status", sortable: true, render: (j) => <StatusBadge status={j.status} />, exportValue: (j) => j.status },
    { key: "salary", label: "Salary Range", render: (j) => { if (!j.salaryMin && !j.salaryMax) return <span className="text-gray-400">Not specified</span>; if (j.salaryMin && j.salaryMax) return <span>${j.salaryMin.toLocaleString()} - ${j.salaryMax.toLocaleString()}</span>; return <span>${(j.salaryMin || j.salaryMax)?.toLocaleString()}</span>; }, exportValue: (j) => j.salaryMin ? `${j.salaryMin}-${j.salaryMax}` : "" },
    { key: "applications", label: "Applications", render: (j) => j._count.applications, exportValue: (j) => String(j._count.applications) },
    { key: "placements", label: "Placements", render: (j) => j._count.placements, exportValue: (j) => String(j._count.placements) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Job Positions</h1><p className="text-gray-500">Manage open positions and track applications</p></div>
        <Link href="/dashboard/jobs/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus className="w-4 h-4" />New Job</Link>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search jobs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Status</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option><option value="ON_HOLD">On Hold</option>
              </select>
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Types</option><option value="FULL_TIME">Full Time</option><option value="PART_TIME">Part Time</option><option value="CONTRACT">Contract</option><option value="TEMPORARY">Temporary</option>
              </select>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={jobs} page={page} totalPages={totalPages} onPageChange={setPage}
          onRowClick={(j) => { setSelected(j); setShowDetailModal(true); }} loading={loading}
          sortField={sortField} sortDirection={sortDirection} onSort={(f, d) => { setSortField(f); setSortDirection(d); setPage(1); }}
          selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)} onBulkUpdate={handleBulkUpdate}
          bulkUpdateOptions={[{ label: "Status", field: "status", values: [{ label: "Open", value: "OPEN" }, { label: "Closed", value: "CLOSED" }, { label: "On Hold", value: "ON_HOLD" }] }]}
          exportFilename="jobs" />
      </div>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelected(null); }} title="Job Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold">{selected.title}</h3><div className="flex gap-2 mt-1"><StatusBadge status={selected.status} /><span className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{selected.type.toLowerCase().replace("_", " ")}</span></div></div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push(`/dashboard/jobs/${selected.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </div>
            {selected.description && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selected.description}</p>}
            <div className="grid grid-cols-2 gap-4">
              {selected.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{selected.location}</span></div>}
              {(selected.salaryMin || selected.salaryMax) && <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-gray-400" /><span>{selected.salaryMin && selected.salaryMax ? `$${selected.salaryMin.toLocaleString()} - $${selected.salaryMax.toLocaleString()}` : `$${(selected.salaryMin || selected.salaryMax)?.toLocaleString()}`}</span></div>}
              <p className="text-sm"><span className="text-gray-500">Applications:</span> {selected._count.applications}</p>
              <p className="text-sm"><span className="text-gray-500">Placements:</span> {selected._count.placements}</p>
            </div>
            {selected.skills.length > 0 && (<div><p className="text-sm font-medium text-gray-700 mb-2">Skills</p><div className="flex flex-wrap gap-2">{selected.skills.map((s, i) => (<span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>))}</div></div>)}
            {selected.requirements.length > 0 && (<div><p className="text-sm font-medium text-gray-700 mb-2">Requirements</p><ul className="list-disc list-inside text-sm text-gray-600 space-y-1">{selected.requirements.map((r, i) => (<li key={i}>{r}</li>))}</ul></div>)}
            <div className="flex justify-end pt-4 border-t"><button onClick={() => router.push(`/dashboard/jobs/${selected.id}`)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">View Full Details &rarr;</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} onConfirm={confirmBulkDelete} title="Delete Selected" message={`Delete ${selectedIds.length} job(s)?`} confirmLabel="Delete All" variant="danger" />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => selected && handleDelete(selected.id)} title="Delete Job" message={`Delete ${selected?.title}?`} confirmLabel="Delete" variant="danger" loading={deleteLoading} />
    </div>
  );
}
