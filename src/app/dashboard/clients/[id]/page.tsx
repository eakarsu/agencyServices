"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  FileText,
  Mail,
  Phone,
  MessageSquare,
  FolderKanban
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

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
  createdBy: { name: string; email: string };
  contracts: Contract[];
  billingInfo: BillingInfo | null;
  projects: Project[];
  communications: Communication[];
  invoices: Invoice[];
}

interface Contract {
  id: string;
  title: string;
  status: string;
  value: number;
  startDate: string;
  endDate: string | null;
}

interface BillingInfo {
  billingAddress: string | null;
  paymentTerms: number;
  preferredMethod: string;
  taxId: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  manager: { name: string };
}

interface Communication {
  id: string;
  type: string;
  subject: string;
  content: string;
  createdAt: string;
  user: { name: string };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  status: string;
  dueDate: string;
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [commForm, setCommForm] = useState({
    type: "EMAIL",
    subject: "",
    content: ""
  });

  const [contractForm, setContractForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    value: "",
    status: "DRAFT"
  });

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${id}`);
      if (!response.ok) throw new Error("Client not found");
      const data = await response.json();
      setClient(data);
    } catch (error) {
      console.error("Error fetching client:", error);
      router.push("/dashboard/clients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      router.push("/dashboard/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleAddCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/clients/${id}/communications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commForm)
      });
      setShowCommunicationModal(false);
      setCommForm({ type: "EMAIL", subject: "", content: "" });
      fetchClient();
    } catch (error) {
      console.error("Error adding communication:", error);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/clients/${id}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractForm)
      });
      setShowContractModal(false);
      setContractForm({ title: "", description: "", startDate: "", endDate: "", value: "", status: "DRAFT" });
      fetchClient();
    } catch (error) {
      console.error("Error adding contract:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            <p className="text-gray-500">{client.company || client.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/clients/${id}/edit`}
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

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {["overview", "projects", "contracts", "communications", "billing"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? "border-b-2 border-primary-600 text-primary-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
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
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {client.website}
                      </a>
                    </div>
                  )}
                  {client.address && (
                    <p className="text-gray-600">{client.address}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Business Details</h3>
                <div className="space-y-2">
                  {client.industry && (
                    <p><span className="text-gray-500">Industry:</span> {client.industry}</p>
                  )}
                  <p><span className="text-gray-500">Created by:</span> {client.createdBy.name}</p>
                  <p><span className="text-gray-500">Since:</span> {new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {client.notes && (
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Projects ({client.projects.length})</h3>
                <Link
                  href={`/dashboard/projects/new?clientId=${id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </Link>
              </div>
              {client.projects.length === 0 ? (
                <p className="text-gray-500">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {client.projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FolderKanban className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-500">Manager: {project.manager.name}</p>
                        </div>
                      </div>
                      <StatusBadge status={project.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "contracts" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Contracts ({client.contracts.length})</h3>
                <button
                  onClick={() => setShowContractModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Contract
                </button>
              </div>
              {client.contracts.length === 0 ? (
                <p className="text-gray-500">No contracts yet</p>
              ) : (
                <div className="space-y-2">
                  {client.contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{contract.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(contract.startDate).toLocaleDateString()} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Ongoing"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${contract.value.toLocaleString()}</p>
                        <StatusBadge status={contract.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "communications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Communication Log</h3>
                <button
                  onClick={() => setShowCommunicationModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  Log Communication
                </button>
              </div>
              {client.communications.length === 0 ? (
                <p className="text-gray-500">No communications logged</p>
              ) : (
                <div className="space-y-3">
                  {client.communications.map((comm) => (
                    <div key={comm.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{comm.subject}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{comm.type}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {comm.user.name} - {new Date(comm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm">{comm.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Billing Information</h3>
                {client.billingInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <p><span className="text-gray-500">Payment Terms:</span> Net {client.billingInfo.paymentTerms}</p>
                    <p><span className="text-gray-500">Preferred Method:</span> {client.billingInfo.preferredMethod.replace("_", " ")}</p>
                    {client.billingInfo.taxId && (
                      <p><span className="text-gray-500">Tax ID:</span> {client.billingInfo.taxId}</p>
                    )}
                    {client.billingInfo.billingAddress && (
                      <p className="col-span-2"><span className="text-gray-500">Billing Address:</span> {client.billingInfo.billingAddress}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No billing information set</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Invoices</h3>
                {client.invoices.length === 0 ? (
                  <p className="text-gray-500">No invoices yet</p>
                ) : (
                  <div className="space-y-2">
                    {client.invoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/dashboard/billing/invoices/${invoice.id}`}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.total.toLocaleString()}</p>
                          <StatusBadge status={invoice.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Client">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {client.name}? This action cannot be undone and will remove all associated data.
        </p>
        <div className="flex justify-end gap-3">
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

      <Modal isOpen={showCommunicationModal} onClose={() => setShowCommunicationModal(false)} title="Log Communication">
        <form onSubmit={handleAddCommunication} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={commForm.type}
              onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="MEETING">Meeting</option>
              <option value="NOTE">Note</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={commForm.subject}
              onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={4}
              value={commForm.content}
              onChange={(e) => setCommForm({ ...commForm, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCommunicationModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)} title="Add Contract">
        <form onSubmit={handleAddContract} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={contractForm.title}
              onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={contractForm.description}
              onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={contractForm.startDate}
                onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={contractForm.endDate}
                onChange={(e) => setContractForm({ ...contractForm, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={contractForm.value}
                onChange={(e) => setContractForm({ ...contractForm, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={contractForm.status}
                onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowContractModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add Contract
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
