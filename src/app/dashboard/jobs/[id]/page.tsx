"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Briefcase, MapPin, DollarSign, Users, CheckCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface JobPosition {
  id: string;
  title: string;
  description: string | null;
  requirements: string[];
  skills: string[];
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  status: string;
  createdAt: string;
  applications: Application[];
  placements: Placement[];
}

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface Placement {
  id: string;
  startDate: string;
  salary: number;
  status: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [job, setJob] = useState<JobPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) throw new Error("Job not found");
      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      router.push("/dashboard/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      router.push("/dashboard/jobs");
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/jobs" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-500">{job.location || "Remote"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/jobs/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b">
              <nav className="flex -mb-px">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "applications", label: `Applications (${job.applications.length})` },
                  { id: "placements", label: `Placements (${job.placements.length})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium ${
                      activeTab === tab.id
                        ? "border-b-2 border-primary-600 text-primary-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {job.description && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{job.description}</p>
                    </div>
                  )}

                  {job.requirements.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {job.requirements.map((req, idx) => (
                          <li key={idx} className="text-gray-600">{req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.skills.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "applications" && (
                <div className="space-y-3">
                  {job.applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No applications yet</p>
                  ) : (
                    job.applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/candidates/${app.candidate.id}`)}
                      >
                        <div>
                          <p className="font-medium">
                            {app.candidate.firstName} {app.candidate.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{app.candidate.email}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={app.status} />
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "placements" && (
                <div className="space-y-3">
                  {job.placements.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No placements yet</p>
                  ) : (
                    job.placements.map((placement) => (
                      <div
                        key={placement.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/dashboard/candidates/${placement.candidate.id}`)}
                      >
                        <div>
                          <p className="font-medium">
                            {placement.candidate.firstName} {placement.candidate.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Started: {new Date(placement.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${placement.salary.toLocaleString()}</p>
                          <StatusBadge status={placement.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Job Details</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="capitalize">{job.type.toLowerCase().replace("_", " ")}</span>
              </div>

              {job.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{job.location}</span>
                </div>
              )}

              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span>
                    {job.salaryMin && job.salaryMax
                      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                      : `$${(job.salaryMin || job.salaryMax)?.toLocaleString()}`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{job.applications.length} Applications</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span>{job.placements.length} Placements</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <StatusBadge status={job.status} />
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Job Position"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this job position? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
