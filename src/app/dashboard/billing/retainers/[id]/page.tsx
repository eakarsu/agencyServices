"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, Repeat } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Retainer {
  id: string;
  clientId: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string | null;
  status: string;
  createdAt: string;
}

export default function RetainerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [retainer, setRetainer] = useState<Retainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchRetainer();
  }, [id]);

  const fetchRetainer = async () => {
    try {
      const response = await fetch(`/api/retainers/${id}`);
      if (!response.ok) throw new Error("Retainer not found");
      const data = await response.json();
      setRetainer(data);
    } catch (error) {
      console.error("Error fetching retainer:", error);
      router.push("/dashboard/billing");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/retainers/${id}`, { method: "DELETE" });
      router.push("/dashboard/billing");
    } catch (error) {
      console.error("Error deleting retainer:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!retainer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Retainer Details</h1>
            <p className="text-gray-500">Recurring billing agreement</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/billing/retainers/${id}/edit`}
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
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Retainer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-lg font-semibold">${retainer.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frequency</p>
                <p className="text-lg font-semibold capitalize">{retainer.frequency.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="text-lg">{new Date(retainer.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="text-lg">{retainer.endDate ? new Date(retainer.endDate).toLocaleDateString() : "Ongoing"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={retainer.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>${retainer.amount.toLocaleString()} / {retainer.frequency.toLowerCase()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Started {new Date(retainer.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Repeat className="w-4 h-4 text-gray-400" />
                <span className="capitalize">{retainer.frequency.toLowerCase()} billing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Retainer"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this retainer? This action cannot be undone.
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
