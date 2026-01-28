"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Mail, Phone, MapPin, Briefcase, Star } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentTitle: string | null;
  currentCompany: string | null;
  experience: number | null;
  expectedSalary: number | null;
  location: string | null;
  status: string;
  score: number | null;
  skills: string[];
  notes: string | null;
  source: string | null;
  interviews: Interview[];
  offers: Offer[];
  applications: Application[];
}

interface Interview {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  location: string | null;
  status: string;
  feedback: string | null;
  rating: number | null;
}

interface Offer {
  id: string;
  salary: number;
  startDate: string;
  expiresAt: string;
  status: string;
}

interface Application {
  id: string;
  job: { id: string; title: string };
  status: string;
  appliedAt: string;
}

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: "", duration: "60", type: "VIDEO", location: "", notes: ""
  });

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const response = await fetch(`/api/candidates/${id}`);
      if (!response.ok) throw new Error("Candidate not found");
      const data = await response.json();
      setCandidate(data);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      router.push("/dashboard/candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/candidates/${id}`, { method: "DELETE" });
      router.push("/dashboard/candidates");
    } catch (error) {
      console.error("Error deleting candidate:", error);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/candidates/${id}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interviewForm)
      });
      setShowInterviewModal(false);
      setInterviewForm({ scheduledAt: "", duration: "60", type: "VIDEO", location: "", notes: "" });
      fetchCandidate();
    } catch (error) {
      console.error("Error scheduling interview:", error);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...candidate, status })
      });
      fetchCandidate();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!candidate) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/candidates" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{candidate.firstName} {candidate.lastName}</h1>
              <StatusBadge status={candidate.status} />
              {candidate.score && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" /><span className="text-sm font-medium">{candidate.score.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-gray-500">{candidate.currentTitle} {candidate.currentCompany && `at ${candidate.currentCompany}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={candidate.status} onChange={(e) => handleUpdateStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg">
            <option value="NEW">New</option>
            <option value="SCREENING">Screening</option>
            <option value="INTERVIEWING">Interviewing</option>
            <option value="OFFERED">Offered</option>
            <option value="PLACED">Placed</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
          <Link href={`/dashboard/candidates/${id}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" />Edit
          </Link>
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" />Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {["overview", "interviews", "applications"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-gray-400" /><span>{candidate.email}</span></div>
                  {candidate.phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /><span>{candidate.phone}</span></div>}
                  {candidate.location && <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-gray-400" /><span>{candidate.location}</span></div>}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Professional Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Experience:</span> {candidate.experience ? `${candidate.experience} years` : "Not specified"}</p>
                  <p><span className="text-gray-500">Expected Salary:</span> {candidate.expectedSalary ? `$${candidate.expectedSalary.toLocaleString()}` : "Not specified"}</p>
                  <p><span className="text-gray-500">Source:</span> {candidate.source || "Unknown"}</p>
                </div>
              </div>
              {candidate.skills.length > 0 && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {candidate.notes && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{candidate.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "interviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Interviews ({candidate.interviews.length})</h3>
                <button onClick={() => setShowInterviewModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                  <Plus className="w-4 h-4" />Schedule Interview
                </button>
              </div>
              {candidate.interviews.length === 0 ? <p className="text-gray-500">No interviews scheduled</p> : (
                <div className="space-y-2">
                  {candidate.interviews.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{interview.type} Interview</p>
                          <p className="text-sm text-gray-500">{new Date(interview.scheduledAt).toLocaleString()} ({interview.duration} min)</p>
                        </div>
                      </div>
                      <StatusBadge status={interview.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "applications" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Applications ({candidate.applications.length})</h3>
              {candidate.applications.length === 0 ? <p className="text-gray-500">No applications</p> : (
                <div className="space-y-2">
                  {candidate.applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{app.job.title}</p>
                          <p className="text-sm text-gray-500">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Candidate">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this candidate?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>

      <Modal isOpen={showInterviewModal} onClose={() => setShowInterviewModal(false)} title="Schedule Interview">
        <form onSubmit={handleScheduleInterview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input type="datetime-local" required value={interviewForm.scheduledAt}
              onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <select value={interviewForm.duration} onChange={(e) => setInterviewForm({ ...interviewForm, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={interviewForm.type} onChange={(e) => setInterviewForm({ ...interviewForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="PHONE">Phone</option>
                <option value="VIDEO">Video</option>
                <option value="ONSITE">Onsite</option>
                <option value="TECHNICAL">Technical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location/Link</label>
            <input type="text" value={interviewForm.location}
              onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={interviewForm.notes}
              onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowInterviewModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Schedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
