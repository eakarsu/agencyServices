"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus, TrendingUp, DollarSign, Eye, MousePointer, Target } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string;
  budget: number | null;
  spent: number;
  startDate: string | null;
  endDate: string | null;
  client: { id: string; name: string };
  manager: { id: string; name: string };
  channels: Channel[];
  metrics: Metric[];
  abTests: ABTest[];
}

interface Channel {
  id: string;
  channel: string;
  budget: number | null;
  spent: number;
}

interface Metric {
  id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

interface ABTest {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  status: string;
  winnerVariant: string | null;
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMetricModal, setShowMetricModal] = useState(false);

  const [metricForm, setMetricForm] = useState({
    date: new Date().toISOString().split("T")[0],
    impressions: "",
    clicks: "",
    conversions: "",
    spend: "",
    revenue: ""
  });

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      if (!response.ok) throw new Error("Campaign not found");
      const data = await response.json();
      setCampaign(data);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      router.push("/dashboard/campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      router.push("/dashboard/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/campaigns/${id}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metricForm)
      });
      setShowMetricModal(false);
      setMetricForm({ date: new Date().toISOString().split("T")[0], impressions: "", clicks: "", conversions: "", spend: "", revenue: "" });
      fetchCampaign();
    } catch (error) {
      console.error("Error adding metric:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!campaign) return null;

  const totalMetrics = campaign.metrics.reduce((acc, m) => ({
    impressions: acc.impressions + m.impressions,
    clicks: acc.clicks + m.clicks,
    conversions: acc.conversions + m.conversions,
    spend: acc.spend + m.spend,
    revenue: acc.revenue + m.revenue
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });

  const ctr = totalMetrics.impressions > 0 ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2) : "0";
  const convRate = totalMetrics.clicks > 0 ? ((totalMetrics.conversions / totalMetrics.clicks) * 100).toFixed(2) : "0";
  const roi = totalMetrics.spend > 0 ? (((totalMetrics.revenue - totalMetrics.spend) / totalMetrics.spend) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaigns" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-gray-500">{campaign.client.name} - {campaign.type.replace("_", " ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/campaigns/${id}/edit`} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Edit className="w-4 h-4" />Edit
          </Link>
          <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 className="w-4 h-4" />Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><Eye className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Impressions</p><p className="text-xl font-bold">{totalMetrics.impressions.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><MousePointer className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Clicks (CTR)</p><p className="text-xl font-bold">{totalMetrics.clicks.toLocaleString()} ({ctr}%)</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Target className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">Conversions</p><p className="text-xl font-bold">{totalMetrics.conversions.toLocaleString()} ({convRate}%)</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><DollarSign className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-sm text-gray-500">Spend</p><p className="text-xl font-bold">${totalMetrics.spend.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-sm text-gray-500">ROI</p><p className="text-xl font-bold">{roi}%</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex -mb-px">
            {["overview", "metrics", "ab-tests"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium capitalize ${activeTab === tab ? "border-b-2 border-primary-600 text-primary-600" : "text-gray-500 hover:text-gray-700"}`}>
                {tab.replace("-", " ")}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Campaign Details</h3>
                {campaign.description && <p className="text-gray-600">{campaign.description}</p>}
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Budget:</span> {campaign.budget ? `$${campaign.budget.toLocaleString()}` : "Not set"}</p>
                  <p><span className="text-gray-500">Spent:</span> ${campaign.spent.toLocaleString()}</p>
                  <p><span className="text-gray-500">Manager:</span> {campaign.manager.name}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Channels</h3>
                {campaign.channels.length === 0 ? <p className="text-gray-500">No channels configured</p> : (
                  <div className="space-y-2">
                    {campaign.channels.map((ch) => (
                      <div key={ch.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{ch.channel.replace("_", " ")}</span>
                        <span className="text-sm text-gray-500">${ch.spent.toLocaleString()} / {ch.budget ? `$${ch.budget.toLocaleString()}` : "-"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "metrics" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Performance Metrics</h3>
                <button onClick={() => setShowMetricModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                  <Plus className="w-4 h-4" />Add Metrics
                </button>
              </div>
              {campaign.metrics.length === 0 ? <p className="text-gray-500">No metrics recorded yet</p> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Impressions</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Clicks</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Conversions</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Spend</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {campaign.metrics.map((m) => (
                        <tr key={m.id}>
                          <td className="px-4 py-2 text-sm">{new Date(m.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{m.impressions.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{m.clicks.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">{m.conversions.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">${m.spend.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-right">${m.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "ab-tests" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">A/B Tests</h3>
              {campaign.abTests.length === 0 ? <p className="text-gray-500">No A/B tests configured</p> : (
                <div className="space-y-2">
                  {campaign.abTests.map((test) => (
                    <div key={test.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{test.name}</span>
                        <StatusBadge status={test.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Variant A:</span> {test.variantA}</div>
                        <div className="p-2 bg-gray-50 rounded"><span className="text-gray-500">Variant B:</span> {test.variantB}</div>
                      </div>
                      {test.winnerVariant && <p className="mt-2 text-sm text-green-600">Winner: {test.winnerVariant}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Campaign">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this campaign?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </Modal>

      <Modal isOpen={showMetricModal} onClose={() => setShowMetricModal(false)} title="Add Metrics">
        <form onSubmit={handleAddMetric} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" required value={metricForm.date} onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impressions</label>
              <input type="number" min="0" value={metricForm.impressions} onChange={(e) => setMetricForm({ ...metricForm, impressions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clicks</label>
              <input type="number" min="0" value={metricForm.clicks} onChange={(e) => setMetricForm({ ...metricForm, clicks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conversions</label>
              <input type="number" min="0" value={metricForm.conversions} onChange={(e) => setMetricForm({ ...metricForm, conversions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spend ($)</label>
              <input type="number" min="0" step="0.01" value={metricForm.spend} onChange={(e) => setMetricForm({ ...metricForm, spend: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue ($)</label>
            <input type="number" min="0" step="0.01" value={metricForm.revenue} onChange={(e) => setMetricForm({ ...metricForm, revenue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowMetricModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Add Metrics</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
