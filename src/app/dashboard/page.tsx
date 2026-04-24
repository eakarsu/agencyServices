import { prisma } from "@/lib/prisma";
import {
  Users,
  FolderKanban,
  Megaphone,
  UserSearch,
  Target,
  DollarSign,
  TrendingUp,
  Clock,
  Briefcase,
  Receipt,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

async function getStats() {
  const [
    clientCount,
    projectCount,
    campaignCount,
    candidateCount,
    leadCount,
    jobCount,
    invoiceSum,
    activeProjects,
    recentActivities
  ] = await Promise.all([
    prisma.client.count(),
    prisma.project.count(),
    prisma.campaign.count(),
    prisma.candidate.count(),
    prisma.lead.count(),
    prisma.jobPosition.count({ where: { status: "OPEN" } }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { status: "PAID" }
    }),
    prisma.project.count({ where: { status: "IN_PROGRESS" } }),
    prisma.activity.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true }
    })
  ]);

  return {
    clientCount,
    projectCount,
    campaignCount,
    candidateCount,
    leadCount,
    jobCount,
    revenue: invoiceSum._sum.total || 0,
    activeProjects,
    recentActivities
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: "Total Clients", value: stats.clientCount, icon: Users, href: "/dashboard/clients", color: "bg-blue-500", hoverColor: "hover:ring-blue-300" },
    { label: "Active Projects", value: stats.activeProjects, icon: FolderKanban, href: "/dashboard/projects", color: "bg-green-500", hoverColor: "hover:ring-green-300" },
    { label: "Campaigns", value: stats.campaignCount, icon: Megaphone, href: "/dashboard/campaigns", color: "bg-purple-500", hoverColor: "hover:ring-purple-300" },
    { label: "Candidates", value: stats.candidateCount, icon: UserSearch, href: "/dashboard/candidates", color: "bg-orange-500", hoverColor: "hover:ring-orange-300" },
    { label: "Open Jobs", value: stats.jobCount, icon: Briefcase, href: "/dashboard/jobs", color: "bg-cyan-500", hoverColor: "hover:ring-cyan-300" },
    { label: "Active Leads", value: stats.leadCount, icon: Target, href: "/dashboard/leads", color: "bg-pink-500", hoverColor: "hover:ring-pink-300" },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, href: "/dashboard/billing", color: "bg-emerald-500", hoverColor: "hover:ring-emerald-300" },
    { label: "Reports", value: "View", icon: BarChart3, href: "/dashboard/reports", color: "bg-indigo-500", hoverColor: "hover:ring-indigo-300" },
    { label: "AI Tools", value: "Open", icon: Sparkles, href: "/dashboard/ai", color: "bg-violet-500", hoverColor: "hover:ring-violet-300" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to your agency management platform</p>
      </div>

      {/* Clickable Stat Cards - Navigate to each section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-all ring-2 ring-transparent ${stat.hoverColor} cursor-pointer group`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-primary-600 mt-3 font-medium group-hover:underline">
                View Details &rarr;
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/dashboard/clients/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">Add Client</span>
            </Link>
            <Link
              href="/dashboard/projects/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FolderKanban className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">New Project</span>
            </Link>
            <Link
              href="/dashboard/campaigns/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Megaphone className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">Create Campaign</span>
            </Link>
            <Link
              href="/dashboard/leads/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Target className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">Add Lead</span>
            </Link>
            <Link
              href="/dashboard/candidates/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <UserSearch className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">Add Candidate</span>
            </Link>
            <Link
              href="/dashboard/jobs/new"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Briefcase className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium">Post Job</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.recentActivities.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {activity.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user.name}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-3xl font-bold text-primary-600">{stats.projectCount}</p>
            <p className="text-sm text-gray-500 mt-1">Total Projects</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{stats.activeProjects}</p>
            <p className="text-sm text-gray-500 mt-1">In Progress</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{stats.campaignCount}</p>
            <p className="text-sm text-gray-500 mt-1">Active Campaigns</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{stats.leadCount}</p>
            <p className="text-sm text-gray-500 mt-1">Pipeline Leads</p>
          </div>
        </div>
      </div>
    </div>
  );
}
