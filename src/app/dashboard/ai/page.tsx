"use client";

import { useState } from "react";
import {
  Sparkles, FileText, Mail, Share2, Search, Users, MessageSquare, BarChart3,
  UserCheck, HelpCircle, FileSignature, TrendingUp, Loader2
} from "lucide-react";

const aiTools = [
  { id: "content", name: "AI Content Generator", description: "Create marketing content, blog posts, and copy", icon: FileText, color: "bg-blue-500" },
  { id: "email", name: "AI Email Writer", description: "Draft professional outreach emails", icon: Mail, color: "bg-green-500" },
  { id: "social", name: "AI Social Media Manager", description: "Generate social media posts and captions", icon: Share2, color: "bg-purple-500" },
  { id: "seo", name: "AI SEO Optimizer", description: "Optimize content for search engines", icon: Search, color: "bg-orange-500" },
  { id: "resume", name: "AI Resume Screener", description: "Evaluate and score candidate resumes", icon: Users, color: "bg-pink-500" },
  { id: "lead", name: "AI Lead Scorer", description: "Automatically qualify and score leads", icon: TrendingUp, color: "bg-indigo-500" },
  { id: "report", name: "AI Report Generator", description: "Create comprehensive client reports", icon: BarChart3, color: "bg-cyan-500" },
  { id: "matcher", name: "AI Candidate Matcher", description: "Match candidates to job requirements", icon: UserCheck, color: "bg-rose-500" },
  { id: "interview", name: "AI Interview Assistant", description: "Generate interview questions", icon: HelpCircle, color: "bg-amber-500" },
  { id: "proposal", name: "AI Proposal Generator", description: "Create professional client proposals", icon: FileSignature, color: "bg-emerald-500" },
  { id: "campaign", name: "AI Campaign Optimizer", description: "Improve ad performance with AI insights", icon: Sparkles, color: "bg-violet-500" },
  { id: "analysis", name: "AI Competitive Analysis", description: "Research and analyze competitors", icon: MessageSquare, color: "bg-teal-500" },
];

export default function AIToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!selectedTool || !prompt.trim()) return;
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: selectedTool, prompt })
      });
      const data = await response.json();
      setResult(data.content || data.error || "No result generated");
    } catch (error) {
      console.error("Error generating content:", error);
      setResult("Error generating content. Please check your OpenAI API key.");
    } finally {
      setLoading(false);
    }
  };

  const selectedToolInfo = aiTools.find(t => t.id === selectedTool);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Tools</h1>
        <p className="text-gray-500">Powered by AI to boost your productivity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-semibold text-gray-900">Available Tools</h2>
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
            {aiTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => { setSelectedTool(tool.id); setResult(""); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedTool === tool.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${tool.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{tool.name}</p>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          {selectedTool ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {selectedToolInfo && (
                  <>
                    <div className={`p-2 rounded-lg ${selectedToolInfo.color}`}>
                      <selectedToolInfo.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{selectedToolInfo.name}</h2>
                      <p className="text-sm text-gray-500">{selectedToolInfo.description}</p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to generate?
                </label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you need..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>

              {result && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {result}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(result)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Copy to clipboard
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Sparkles className="w-12 h-12 mb-4 text-gray-300" />
              <p>Select a tool from the left to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
