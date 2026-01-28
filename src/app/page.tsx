import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-white">Agency Services</h1>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-white hover:text-primary-200 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6">
            Complete Agency Management Platform with AI
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Manage clients, projects, campaigns, candidates, and leads all in one place.
            Powered by AI to boost your productivity.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors">
              Start Free Trial
            </Link>
            <Link href="/login" className="px-8 py-3 border border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Client Management</h3>
            <p className="text-primary-100">Track clients, contracts, communications, and billing all in one place.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-3">Project & Campaign</h3>
            <p className="text-primary-100">Manage projects, tasks, milestones, and marketing campaigns efficiently.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Tools</h3>
            <p className="text-primary-100">Content generation, lead scoring, resume screening, and more.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
