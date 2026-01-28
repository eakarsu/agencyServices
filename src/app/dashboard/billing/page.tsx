"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Filter, DollarSign, Receipt, Clock, AlertCircle, Calendar, TrendingUp, Repeat } from "lucide-react";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Invoice {
  id: string;
  invoiceNumber: string;
  client: { name: string };
  type: string;
  status: string;
  total: number;
  dueDate: string;
  createdAt: string;
}

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

export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("invoices");

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(1);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("");
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, overdue: 0 });

  // Retainers
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [retainersLoading, setRetainersLoading] = useState(false);
  const [retainersPage, setRetainersPage] = useState(1);
  const [retainersTotalPages, setRetainersTotalPages] = useState(1);
  const [showRetainerModal, setShowRetainerModal] = useState(false);
  const [retainerClients, setRetainerClients] = useState<any[]>([]);
  const [retainerForm, setRetainerForm] = useState({
    clientId: "",
    amount: "",
    frequency: "MONTHLY",
    startDate: "",
    endDate: "",
    status: "ACTIVE"
  });

  // Commissions
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionsPage, setCommissionsPage] = useState(1);
  const [commissionsTotalPages, setCommissionsTotalPages] = useState(1);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    type: "PLACEMENT",
    referenceId: "",
    amount: "",
    percentage: "",
    status: "PENDING"
  });

  useEffect(() => {
    if (activeTab === "invoices") {
      fetchInvoices();
    } else if (activeTab === "retainers") {
      fetchRetainers();
      fetchClients();
    } else if (activeTab === "commissions") {
      fetchCommissions();
    }
  }, [activeTab, invoicesPage, invoiceStatusFilter, retainersPage, commissionsPage]);

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const params = new URLSearchParams({
        page: invoicesPage.toString(),
        limit: "10",
        ...(invoiceStatusFilter && { status: invoiceStatusFilter })
      });
      const response = await fetch(`/api/invoices?${params}`);
      const data = await response.json();
      setInvoices(data.invoices);
      setInvoicesTotalPages(data.pagination.totalPages);

      const allInvoices = await fetch("/api/invoices?limit=1000").then(r => r.json());
      const invoiceList = allInvoices.invoices;
      setStats({
        total: invoiceList.reduce((sum: number, i: Invoice) => sum + i.total, 0),
        paid: invoiceList.filter((i: Invoice) => i.status === "PAID").reduce((sum: number, i: Invoice) => sum + i.total, 0),
        pending: invoiceList.filter((i: Invoice) => i.status === "SENT").reduce((sum: number, i: Invoice) => sum + i.total, 0),
        overdue: invoiceList.filter((i: Invoice) => i.status === "OVERDUE").reduce((sum: number, i: Invoice) => sum + i.total, 0)
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchRetainers = async () => {
    setRetainersLoading(true);
    try {
      const params = new URLSearchParams({
        page: retainersPage.toString(),
        limit: "10"
      });
      const response = await fetch(`/api/retainers?${params}`);
      const data = await response.json();
      setRetainers(data.retainers);
      setRetainersTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching retainers:", error);
    } finally {
      setRetainersLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?limit=1000");
      const data = await response.json();
      setRetainerClients(data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchCommissions = async () => {
    setCommissionsLoading(true);
    try {
      const params = new URLSearchParams({
        page: commissionsPage.toString(),
        limit: "10"
      });
      const response = await fetch(`/api/commissions?${params}`);
      const data = await response.json();
      setCommissions(data.commissions);
      setCommissionsTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setCommissionsLoading(false);
    }
  };

  const handleCreateRetainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/retainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retainerForm)
      });
      setShowRetainerModal(false);
      setRetainerForm({
        clientId: "",
        amount: "",
        frequency: "MONTHLY",
        startDate: "",
        endDate: "",
        status: "ACTIVE"
      });
      fetchRetainers();
    } catch (error) {
      console.error("Error creating retainer:", error);
    }
  };

  const handleCreateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commissionForm)
      });
      setShowCommissionModal(false);
      setCommissionForm({
        type: "PLACEMENT",
        referenceId: "",
        amount: "",
        percentage: "",
        status: "PENDING"
      });
      fetchCommissions();
    } catch (error) {
      console.error("Error creating commission:", error);
    }
  };

  const invoiceColumns = [
    {
      key: "invoiceNumber",
      label: "Invoice",
      render: (inv: Invoice) => (
        <div>
          <p className="font-medium">{inv.invoiceNumber}</p>
          <p className="text-sm text-gray-500">{inv.client.name}</p>
        </div>
      )
    },
    { key: "type", label: "Type", render: (inv: Invoice) => <span className="capitalize">{inv.type.toLowerCase().replace("_", " ")}</span> },
    { key: "status", label: "Status", render: (inv: Invoice) => <StatusBadge status={inv.status} /> },
    { key: "total", label: "Amount", render: (inv: Invoice) => <span className="font-medium">${inv.total.toLocaleString()}</span> },
    { key: "dueDate", label: "Due Date", render: (inv: Invoice) => new Date(inv.dueDate).toLocaleDateString() },
    { key: "createdAt", label: "Created", render: (inv: Invoice) => new Date(inv.createdAt).toLocaleDateString() }
  ];

  const retainerColumns = [
    {
      key: "client",
      label: "Client",
      render: (ret: Retainer) => <span>Client ID: {ret.clientId.slice(0, 8)}...</span>
    },
    { key: "amount", label: "Amount", render: (ret: Retainer) => <span className="font-medium">${ret.amount.toLocaleString()}</span> },
    { key: "frequency", label: "Frequency", render: (ret: Retainer) => <span className="capitalize">{ret.frequency.toLowerCase()}</span> },
    { key: "startDate", label: "Start Date", render: (ret: Retainer) => new Date(ret.startDate).toLocaleDateString() },
    { key: "endDate", label: "End Date", render: (ret: Retainer) => ret.endDate ? new Date(ret.endDate).toLocaleDateString() : "Ongoing" },
    { key: "status", label: "Status", render: (ret: Retainer) => <StatusBadge status={ret.status} /> }
  ];

  const commissionColumns = [
    { key: "type", label: "Type", render: (com: Commission) => <span className="capitalize">{com.type}</span> },
    { key: "referenceId", label: "Reference", render: (com: Commission) => <span className="text-sm text-gray-500">{com.referenceId.slice(0, 8)}...</span> },
    { key: "amount", label: "Amount", render: (com: Commission) => <span className="font-medium">${com.amount.toLocaleString()}</span> },
    { key: "percentage", label: "Rate", render: (com: Commission) => <span>{com.percentage}%</span> },
    { key: "status", label: "Status", render: (com: Commission) => <StatusBadge status={com.status} /> },
    { key: "paidAt", label: "Paid Date", render: (com: Commission) => com.paidAt ? new Date(com.paidAt).toLocaleDateString() : "-" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Revenue</h1>
          <p className="text-gray-500">Manage invoices, retainers, and commissions</p>
        </div>
        {activeTab === "invoices" && (
          <Link href="/dashboard/billing/invoices/new" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />New Invoice
          </Link>
        )}
        {activeTab === "retainers" && (
          <button onClick={() => setShowRetainerModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />New Retainer
          </button>
        )}
        {activeTab === "commissions" && (
          <button onClick={() => setShowCommissionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            <Plus className="w-4 h-4" />New Commission
          </button>
        )}
      </div>

      {activeTab === "invoices" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-sm text-gray-500">Total Invoiced</p><p className="text-xl font-bold">${stats.total.toLocaleString()}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><Receipt className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-sm text-gray-500">Paid</p><p className="text-xl font-bold">${stats.paid.toLocaleString()}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
              <div><p className="text-sm text-gray-500">Pending</p><p className="text-xl font-bold">${stats.pending.toLocaleString()}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div>
              <div><p className="text-sm text-gray-500">Overdue</p><p className="text-xl font-bold">${stats.overdue.toLocaleString()}</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: "invoices", label: "Invoices", icon: Receipt },
              { id: "retainers", label: "Retainers", icon: Repeat },
              { id: "commissions", label: "Commissions", icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary-600 text-primary-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === "invoices" && (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select value={invoiceStatusFilter} onChange={(e) => { setInvoiceStatusFilter(e.target.value); setInvoicesPage(1); }}
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white">
                    <option value="">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <DataTable columns={invoiceColumns} data={invoices} page={invoicesPage} totalPages={invoicesTotalPages}
              onPageChange={setInvoicesPage} onRowClick={(inv) => router.push(`/dashboard/billing/invoices/${inv.id}`)} loading={invoicesLoading} />
          </>
        )}

        {activeTab === "retainers" && (
          <DataTable columns={retainerColumns} data={retainers} page={retainersPage} totalPages={retainersTotalPages}
            onPageChange={setRetainersPage} onRowClick={(ret) => router.push(`/dashboard/billing/retainers/${ret.id}`)} loading={retainersLoading} />
        )}

        {activeTab === "commissions" && (
          <DataTable columns={commissionColumns} data={commissions} page={commissionsPage} totalPages={commissionsTotalPages}
            onPageChange={setCommissionsPage} onRowClick={(com) => router.push(`/dashboard/billing/commissions/${com.id}`)} loading={commissionsLoading} />
        )}
      </div>

      <Modal isOpen={showRetainerModal} onClose={() => setShowRetainerModal(false)} title="New Retainer">
        <form onSubmit={handleCreateRetainer} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select required value={retainerForm.clientId} onChange={(e) => setRetainerForm({ ...retainerForm, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Client</option>
              {retainerClients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input type="number" required value={retainerForm.amount} onChange={(e) => setRetainerForm({ ...retainerForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
            <select required value={retainerForm.frequency} onChange={(e) => setRetainerForm({ ...retainerForm, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input type="date" required value={retainerForm.startDate} onChange={(e) => setRetainerForm({ ...retainerForm, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={retainerForm.endDate} onChange={(e) => setRetainerForm({ ...retainerForm, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={() => setShowRetainerModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create Retainer</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showCommissionModal} onClose={() => setShowCommissionModal(false)} title="New Commission">
        <form onSubmit={handleCreateCommission} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <input type="text" required value={commissionForm.type} onChange={(e) => setCommissionForm({ ...commissionForm, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="PLACEMENT, SALE, etc." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID *</label>
            <input type="text" required value={commissionForm.referenceId} onChange={(e) => setCommissionForm({ ...commissionForm, referenceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Related record ID" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input type="number" required value={commissionForm.amount} onChange={(e) => setCommissionForm({ ...commissionForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="1000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Percentage *</label>
            <input type="number" step="0.01" required value={commissionForm.percentage} onChange={(e) => setCommissionForm({ ...commissionForm, percentage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="10" />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={() => setShowCommissionModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Create Commission</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
