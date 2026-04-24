"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Star, Edit, Trash2, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import DataTable from "@/components/DataTable";
import type { Column } from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  location: string | null;
  status: string;
  score: number | null;
  experience: number | null;
  expectedSalary: number | null;
  skills: string[];
  source: string | null;
  _count: { applications: number; interviews: number };
}

export default function CandidatesPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
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
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, [page, search, statusFilter, sortField, sortDirection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "10", sortField, sortDirection, ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const response = await fetch(`/api/candidates?${params}`);
      const data = await response.json();
      setCandidates(data.candidates);
      setTotalPages(data.pagination.totalPages);
    } catch { addToast("error", "Failed to load candidates"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      addToast("success", "Candidate deleted"); setShowDeleteConfirm(false); setShowDetailModal(false); setSelected(null); fetchData();
    } catch { addToast("error", "Failed to delete"); } finally { setDeleteLoading(false); }
  };

  const confirmBulkDelete = async () => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", entity: "candidates", ids: selectedIds }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Deleted ${data.count} candidates`); setSelectedIds([]); setShowBulkDeleteConfirm(false); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const handleBulkUpdate = async (ids: string[], updateData: Record<string, string>) => {
    try {
      const res = await fetch("/api/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", entity: "candidates", ids, data: updateData }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      addToast("success", `Updated ${data.count} candidates`); setSelectedIds([]); fetchData();
    } catch (err) { addToast("error", err instanceof Error ? err.message : "Failed"); }
  };

  const columns: Column<Candidate>[] = [
    { key: "name", label: "Candidate", sortable: true, render: (c) => (<div><p className="font-medium">{c.firstName} {c.lastName}</p><p className="text-sm text-gray-500">{c.email}</p></div>), exportValue: (c) => `${c.firstName} ${c.lastName}` },
    { key: "current", label: "Current Role", render: (c) => c.currentTitle ? (<div><p className="text-sm">{c.currentTitle}</p><p className="text-sm text-gray-500">{c.currentCompany}</p></div>) : <span className="text-gray-400">-</span>, exportValue: (c) => c.currentTitle || "" },
    { key: "status", label: "Status", sortable: true, render: (c) => <StatusBadge status={c.status} />, exportValue: (c) => c.status },
    { key: "score", label: "Score", sortable: true, render: (c) => c.score ? (<div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-current" /><span>{c.score}</span></div>) : <span className="text-gray-400">-</span>, exportValue: (c) => String(c.score || "") },
    { key: "experience", label: "Experience", sortable: true, render: (c) => c.experience ? `${c.experience} years` : "-", exportValue: (c) => c.experience ? `${c.experience}` : "" },
    { key: "interviews", label: "Interviews", render: (c) => c._count.interviews, exportValue: (c) => String(c._count.interviews) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Candidates</h1><p className="text-gray-500">Manage your candidate pipeline</p></div>
        <Link href="/dashboard/candidates/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"><Plus className="w-4 h-4" />Add Candidate</Link>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Search candidates..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                <option value="">All Status</option><option value="NEW">New</option><option value="SCREENING">Screening</option><option value="INTERVIEWING">Interviewing</option><option value="OFFERED">Offered</option><option value="PLACED">Placed</option><option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={candidates} page={page} totalPages={totalPages} onPageChange={setPage}
          onRowClick={(c) => { setSelected(c); setShowDetailModal(true); }} loading={loading}
          sortField={sortField} sortDirection={sortDirection} onSort={(f, d) => { setSortField(f); setSortDirection(d); setPage(1); }}
          selectable selectedIds={selectedIds} onSelectionChange={setSelectedIds}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)} onBulkUpdate={handleBulkUpdate}
          bulkUpdateOptions={[{ label: "Status", field: "status", values: [{ label: "New", value: "NEW" }, { label: "Screening", value: "SCREENING" }, { label: "Interviewing", value: "INTERVIEWING" }, { label: "Offered", value: "OFFERED" }, { label: "Placed", value: "PLACED" }, { label: "Rejected", value: "REJECTED" }] }]}
          exportFilename="candidates" />
      </div>

      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelected(null); }} title="Candidate Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-semibold">{selected.firstName} {selected.lastName}</h3><StatusBadge status={selected.status} /></div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push(`/dashboard/candidates/${selected.id}/edit`)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" />Delete</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{selected.email}</span></div>
                {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{selected.phone}</span></div>}
                {selected.location && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{selected.location}</span></div>}
                {selected.currentTitle && <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-gray-400" /><span>{selected.currentTitle} at {selected.currentCompany}</span></div>}
              </div>
              <div className="space-y-3">
                {selected.score && <p className="text-sm"><span className="text-gray-500">Score:</span> {selected.score}</p>}
                {selected.experience && <p className="text-sm"><span className="text-gray-500">Experience:</span> {selected.experience} years</p>}
                {selected.expectedSalary && <p className="text-sm"><span className="text-gray-500">Expected Salary:</span> ${selected.expectedSalary.toLocaleString()}</p>}
                {selected.source && <p className="text-sm"><span className="text-gray-500">Source:</span> {selected.source}</p>}
                <p className="text-sm"><span className="text-gray-500">Interviews:</span> {selected._count.interviews}</p>
              </div>
            </div>
            {selected.skills.length > 0 && (
              <div><p className="text-sm font-medium text-gray-700 mb-2">Skills</p><div className="flex flex-wrap gap-2">{selected.skills.map((skill, i) => (<span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">{skill}</span>))}</div></div>
            )}
            <div className="flex justify-end pt-4 border-t"><button onClick={() => router.push(`/dashboard/candidates/${selected.id}`)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">View Full Details &rarr;</button></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog isOpen={showBulkDeleteConfirm} onClose={() => setShowBulkDeleteConfirm(false)} onConfirm={confirmBulkDelete} title="Delete Selected" message={`Delete ${selectedIds.length} candidate(s)?`} confirmLabel="Delete All" variant="danger" />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => selected && handleDelete(selected.id)} title="Delete Candidate" message={`Delete ${selected?.firstName} ${selected?.lastName}?`} confirmLabel="Delete" variant="danger" loading={deleteLoading} />
    </div>
  );
}
