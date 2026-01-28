"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Mail, DollarSign, Calendar, FileText, CreditCard } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    address: string | null;
  };
  createdBy: {
    name: string;
  };
  items: InvoiceItem[];
  payments: Payment[];
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  createdAt: string;
}

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "",
    message: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "CREDIT_CARD",
    reference: ""
  });

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) throw new Error("Invoice not found");
      const data = await response.json();
      setInvoice(data);
      setNewStatus(data.status);
      setEmailForm({
        to: data.client.email,
        subject: `Invoice ${data.invoiceNumber} from Agency Services`,
        message: `Dear ${data.client.name},\n\nPlease find attached invoice ${data.invoiceNumber} for $${data.total.toLocaleString()}.\n\nDue date: ${new Date(data.dueDate).toLocaleDateString()}\n\nThank you for your business!`
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      router.push("/dashboard/billing");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          amount: parseFloat(paymentForm.amount)
        })
      });
      setShowPaymentModal(false);
      setPaymentForm({ amount: "", method: "CREDIT_CARD", reference: "" });
      fetchInvoice();
    } catch (error) {
      console.error("Error adding payment:", error);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      setShowStatusModal(false);
      fetchInvoice();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDownloadPDF = () => {
    // Open print dialog for now - can be enhanced with PDF library later
    window.print();
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/invoices/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm)
      });
      setShowEmailModal(false);
      alert("Invoice email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!invoice) return null;

  const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = invoice.total - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/billing" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-gray-500">
              {invoice.client.name} • Due {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-900">Invoice Details</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Bill To</h4>
                  <p className="font-medium">{invoice.client.name}</p>
                  <p className="text-sm text-gray-600">{invoice.client.email}</p>
                  {invoice.client.address && (
                    <p className="text-sm text-gray-600 mt-1">{invoice.client.address}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Invoice Info</h4>
                  <p className="text-sm"><span className="font-medium">Type:</span> {invoice.type.replace("_", " ")}</p>
                  <p className="text-sm"><span className="font-medium">Created:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm"><span className="font-medium">Created By:</span> {invoice.createdBy.name}</p>
                  {invoice.paidAt && (
                    <p className="text-sm"><span className="font-medium">Paid:</span> {new Date(invoice.paidAt).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">${item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Subtotal</td>
                      <td className="px-4 py-3 text-right font-medium">${invoice.subtotal.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">Tax</td>
                      <td className="px-4 py-3 text-right font-medium">${invoice.tax.toLocaleString()}</td>
                    </tr>
                    <tr className="font-bold">
                      <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                      <td className="px-4 py-3 text-right">${invoice.total.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {invoice.notes && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-semibold">${invoice.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid</span>
                <span className="font-semibold text-green-600">${totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Balance Due</span>
                <span className="font-semibold text-lg">${balance.toLocaleString()}</span>
              </div>
            </div>
            {balance > 0 && invoice.status !== "CANCELLED" && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Record Payment
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
            {invoice.payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded</p>
            ) : (
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <CreditCard className="w-4 h-4 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">${payment.amount.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{payment.method.replace("_", " ")}</p>
                      {payment.reference && (
                        <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form onSubmit={handleAddPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              max={balance}
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={`Max: $${balance.toLocaleString()}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
            <select
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHECK">Check</option>
              <option value="PAYPAL">PayPal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
            <input
              type="text"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Invoice Status">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Update Status
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Send Invoice via Email">
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
            <input
              type="email"
              required
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea
              required
              rows={6}
              value={emailForm.message}
              onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Send Email
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
