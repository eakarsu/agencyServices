"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, FolderKanban, Target, Megaphone, UserSearch } from "lucide-react";

interface Stats {
  clients: number;
  projects: number;
  campaigns: number;
  candidates: number;
  leads: number;
  revenue: number;
  projectsCompleted: number;
  leadsConverted: number;
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats>({
    clients: 0, projects: 0, campaigns: 0, candidates: 0, leads: 0, revenue: 0, projectsCompleted: 0, leadsConverted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, projectsRes, campaignsRes, candidatesRes, leadsRes, invoicesRes] = await Promise.all([
        fetch("/api/clients?limit=1000"),
        fetch("/api/projects?limit=1000"),
        fetch("/api/campaigns?limit=1000"),
        fetch("/api/candidates?limit=1000"),
        fetch("/api/leads?limit=1000"),
        fetch("/api/invoices?limit=1000")
      ]);

      const [clients, projects, campaigns, candidates, leads, invoices] = await Promise.all([
        clientsRes.json(),
        projectsRes.json(),
        campaignsRes.json(),
        candidatesRes.json(),
        leadsRes.json(),
        invoicesRes.json()
      ]);

      setStats({
        clients: clients.pagination?.total || 0,
        projects: projects.pagination?.total || 0,
        campaigns: campaigns.pagination?.total || 0,
        candidates: candidates.pagination?.total || 0,
        leads: leads.pagination?.total || 0,
        revenue: invoices.invoices?.filter((i: { status: string }) => i.status === "PAID")
          .reduce((sum: number, i: { total: number }) => sum + i.total, 0) || 0,
        projectsCompleted: projects.projects?.filter((p: { status: string }) => p.status === "COMPLETED").length || 0,
        leadsConverted: leads.leads?.filter((l: { status: string }) => l.status === "CONVERTED").length || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500">Overview of your agency performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">From paid invoices</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.projects}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg"><FolderKanban className="w-6 h-6 text-purple-600" /></div>
          </div>
          <div className="mt-4 text-sm text-gray-500">{stats.projectsCompleted} completed</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.leads}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-lg"><Target className="w-6 h-6 text-pink-600" /></div>
          </div>
          <div className="mt-4 text-sm text-gray-500">{stats.leadsConverted} converted</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Campaigns</span><span>{stats.campaigns}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${Math.min(stats.campaigns * 10, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Candidates</span><span>{stats.candidates}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-orange-500 rounded-full" style={{ width: `${Math.min(stats.candidates * 5, 100)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Lead Conversion Rate</span><span>{stats.leads > 0 ? Math.round((stats.leadsConverted / stats.leads) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-green-500 rounded-full" style={{ width: stats.leads > 0 ? `${(stats.leadsConverted / stats.leads) * 100}%` : '0%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Project Completion Rate</span><span>{stats.projects > 0 ? Math.round((stats.projectsCompleted / stats.projects) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-blue-500 rounded-full" style={{ width: stats.projects > 0 ? `${(stats.projectsCompleted / stats.projects) * 100}%` : '0%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-500">Active Campaigns</span>
              </div>
              <p className="text-2xl font-bold">{stats.campaigns}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserSearch className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-500">In Pipeline</span>
              </div>
              <p className="text-2xl font-bold">{stats.candidates}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-pink-600" />
                <span className="text-sm text-gray-500">New Leads</span>
              </div>
              <p className="text-2xl font-bold">{stats.leads - stats.leadsConverted}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FolderKanban className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-500">Active Projects</span>
              </div>
              <p className="text-2xl font-bold">{stats.projects - stats.projectsCompleted}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
