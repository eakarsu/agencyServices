"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus, Phone, Mail, Building, TrendingUp, Calendar } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

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
  qualityScore: number | null;
  notes: string | null;
  assignedTo: { id: string; name: string } | null;
  followUps: FollowUp[];
}

interface FollowUp {
  id: string;
  type: string;
  scheduledAt: string;
  completedAt: string | null;
  notes: string | null;
  outcome: string | null;
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const [followUpForm, setFollowUpForm] = useState({
    type: "CALL", scheduledAt: "", notes: ""
  });

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await fetch(`/api/leads/${id}`);
      if (!response.ok) throw new Error("Lead not found");
      const data = await response.json();
      setLead(data);
    } catch (error) {
      console.error("Error fetching lead:", error);
      router.push("/dashboard/leads");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      router.push("/dashboard/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, status })
      });
      fetchLead();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/leads/${id}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followUpForm)
      });
      setShowFollowUpModal(false);
      setFollowUpForm({ type: "CALL", scheduledAt: "", notes: "" });
      fetchLead();
    } catch (error) {
      console.error("Error adding follow-up:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!lead) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/leads" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
              <StatusBadge status={lead.status} />
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(lead.score)}`}>
                Score: {lead.score}
              </span>
            </div>
            <p className="text-gray-500">{lead.title} {lead.company && `at ${lead.company}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={lead.status} onChange={(e) => handleUpdateStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
          <Link href={`/dashboard/leads/${id}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" />Edit
          </Link>
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" />Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{lead.email}</span>
              </div>
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{lead.company}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span>Source: {lead.source.replace("_", " ")}</span>
              </div>
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Follow-ups ({lead.followUps.length})</h3>
              <button onClick={() => setShowFollowUpModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                <Plus className="w-4 h-4" />Schedule Follow-up
              </button>
            </div>
            {lead.followUps.length === 0 ? <p className="text-gray-500">No follow-ups scheduled</p> : (
              <div className="space-y-3">
                {lead.followUps.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium capitalize">{fu.type.toLowerCase()}</p>
                        <p className="text-sm text-gray-500">{new Date(fu.scheduledAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusBadge status={fu.completedAt ? "COMPLETED" : "PENDING"} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Lead Score</h3>
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold ${getScoreColor(lead.score)}`}>
                {lead.score}
              </div>
              <p className="mt-2 text-sm text-gray-500">out of 100</p>
            </div>
          </div>

          {lead.assignedTo && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Assigned To</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                  {lead.assignedTo.name.charAt(0)}
                </div>
                <span className="font-medium">{lead.assignedTo.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Lead">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this lead?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>

      <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title="Schedule Follow-up">
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={followUpForm.type} onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="DEMO">Demo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input type="datetime-local" required value={followUpForm.scheduledAt}
              onChange={(e) => setFollowUpForm({ ...followUpForm, scheduledAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={followUpForm.notes}
              onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowFollowUpModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Schedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
