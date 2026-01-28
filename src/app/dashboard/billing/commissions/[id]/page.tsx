"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, DollarSign, Percent, Calendar } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Commission {
  id: string;
  type: string;
  referenceId: string;
  amount: number;
  percentage: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export default function CommissionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchCommission();
  }, [id]);

  const fetchCommission = async () => {
    try {
      const response = await fetch(`/api/commissions/${id}`);
      if (!response.ok) throw new Error("Commission not found");
      const data = await response.json();
      setCommission(data);
    } catch (error) {
      console.error("Error fetching commission:", error);
      router.push("/dashboard/billing");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/commissions/${id}`, { method: "DELETE" });
      router.push("/dashboard/billing");
    } catch (error) {
      console.error("Error deleting commission:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!commission) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commission Details</h1>
            <p className="text-gray-500 capitalize">{commission.type} Commission</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/billing/commissions/${id}/edit`}
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
            <h3 className="font-semibold text-gray-900 mb-4">Commission Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="text-lg font-semibold capitalize">{commission.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reference ID</p>
                <p className="text-lg font-mono text-sm">{commission.referenceId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-lg font-semibold">${commission.amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Percentage</p>
                <p className="text-lg font-semibold">{commission.percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={commission.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Date</p>
                <p className="text-lg">{commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : "Not paid yet"}</p>
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
                <span>${commission.amount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Percent className="w-4 h-4 text-gray-400" />
                <span>{commission.percentage}% commission rate</span>
              </div>
              {commission.paidAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Paid on {new Date(commission.paidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Commission"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete this commission? This action cannot be undone.
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
