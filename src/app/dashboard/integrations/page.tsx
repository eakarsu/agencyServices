"use client";

import { useState } from "react";
import { Linkedin, Briefcase, Slack, ShieldCheck, Database, Loader2 } from "lucide-react";

type IntegrationKey = "linkedin" | "indeed" | "slack" | "checkr" | "bamboohr";

const INTEGRATIONS: {
  key: IntegrationKey;
  label: string;
  icon: any;
  color: string;
  fields: { name: string; label: string; placeholder?: string }[];
}[] = [
  {
    key: "linkedin",
    label: "LinkedIn — Post Job",
    icon: Linkedin,
    color: "bg-blue-600",
    fields: [
      { name: "jobTitle", label: "Job title" },
      { name: "jobDescription", label: "Description" },
    ],
  },
  {
    key: "indeed",
    label: "Indeed — Post Job",
    icon: Briefcase,
    color: "bg-indigo-600",
    fields: [
      { name: "jobTitle", label: "Job title" },
      { name: "jobDescription", label: "Description" },
      { name: "location", label: "Location" },
    ],
  },
  {
    key: "slack",
    label: "Slack — Notify",
    icon: Slack,
    color: "bg-purple-600",
    fields: [
      { name: "message", label: "Message" },
      { name: "channel", label: "Channel (optional)" },
    ],
  },
  {
    key: "checkr",
    label: "Checkr — Background Check",
    icon: ShieldCheck,
    color: "bg-emerald-600",
    fields: [
      { name: "candidateId", label: "Candidate ID" },
      { name: "firstName", label: "First name" },
      { name: "lastName", label: "Last name" },
      { name: "email", label: "Email" },
    ],
  },
  {
    key: "bamboohr",
    label: "BambooHR — ATS Sync",
    icon: Database,
    color: "bg-amber-600",
    fields: [
      { name: "event", label: "Event (e.g. candidate.created)" },
    ],
  },
];

export default function IntegrationsPage() {
  const [selected, setSelected] = useState<IntegrationKey>("linkedin");
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const config = INTEGRATIONS.find((i) => i.key === selected)!;

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(`/api/integrations/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      setResult({ status: resp.status, data });
    } catch (e: any) {
      setResult({ error: e?.message || "request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Integrations</h1>
      <p className="text-sm text-gray-600 mb-6">
        External services. Endpoints return HTTP 503 when env vars are not configured.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {INTEGRATIONS.map((i) => {
          const Icon = i.icon;
          return (
            <button
              key={i.key}
              onClick={() => {
                setSelected(i.key);
                setForm({});
                setResult(null);
              }}
              className={`p-4 rounded border ${selected === i.key ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-200"} hover:border-gray-400`}
            >
              <div className={`w-10 h-10 rounded ${i.color} flex items-center justify-center mb-2`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-sm font-medium">{i.label}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-white p-5 rounded border border-gray-200">
        <h2 className="font-semibold mb-4">{config.label}</h2>
        <div className="space-y-3">
          {config.fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm text-gray-700 mb-1">{f.label}</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder={f.placeholder || f.label}
                value={form[f.name] || ""}
                onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Send"}
        </button>

        {result && (
          <div className="mt-4">
            {result.status === 503 ? (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-900 rounded p-3">
                <div className="font-medium">Configure {config.label}</div>
                <div className="text-sm mt-1">
                  Missing env vars: <code>{result.data?.missing}</code>
                </div>
                <div className="text-sm mt-1">{result.data?.configure}</div>
              </div>
            ) : (
              <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
