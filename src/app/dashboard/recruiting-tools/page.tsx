"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

type Tab = "match" | "advance" | "resume" | "salary" | "bulk";

export default function RecruitingToolsPage() {
  const [tab, setTab] = useState<Tab>("match");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Recruiting Tools</h1>
      <p className="text-sm text-gray-600 mb-6">
        Vector matcher, workflow automation, resume parser, salary benchmarks, and bulk email.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["match", "advance", "resume", "salary", "bulk"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm border ${tab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-300"}`}
          >
            {t === "match" && "Candidate Matcher"}
            {t === "advance" && "Pipeline Advance"}
            {t === "resume" && "Resume Parser"}
            {t === "salary" && "Salary Benchmark"}
            {t === "bulk" && "Bulk Email"}
          </button>
        ))}
      </div>

      {tab === "match" && <MatchTab />}
      {tab === "advance" && <AdvanceTab />}
      {tab === "resume" && <ResumeTab />}
      {tab === "salary" && <SalaryTab />}
      {tab === "bulk" && <BulkTab />}
    </div>
  );
}

function MatchTab() {
  const [jd, setJd] = useState("");
  const [candidates, setCandidates] = useState(
    JSON.stringify(
      [
        { id: 1, name: "Alice", skills: "react typescript node postgres" },
        { id: 2, name: "Bob", skills: "python django ml" },
      ],
      null,
      2
    )
  );
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, candidates: JSON.parse(candidates) }),
      });
      setOut(await resp.json());
    } catch (e: any) {
      setOut({ error: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded border border-gray-200">
      <label className="block text-sm font-medium mb-1">Job description</label>
      <textarea className="w-full border rounded p-2 mb-3" rows={3} value={jd} onChange={(e) => setJd(e.target.value)} />
      <label className="block text-sm font-medium mb-1">Candidates JSON</label>
      <textarea className="w-full border rounded p-2 mb-3 font-mono text-xs" rows={6} value={candidates} onChange={(e) => setCandidates(e.target.value)} />
      <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Match"}
      </button>
      {out && <pre className="bg-gray-50 border rounded p-3 text-xs mt-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}

function AdvanceTab() {
  const [stage, setStage] = useState("applied");
  const [signals, setSignals] = useState(JSON.stringify({ score: 0.8, recruiterApproval: false, interviewPassed: false, offerAccepted: false }, null, 2));
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/workflows/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, signals: JSON.parse(signals) }),
      });
      setOut(await resp.json());
    } catch (e: any) {
      setOut({ error: e?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded border border-gray-200">
      <label className="block text-sm font-medium mb-1">Current stage</label>
      <select className="border rounded p-2 mb-3" value={stage} onChange={(e) => setStage(e.target.value)}>
        {["applied", "screening", "interview", "offer", "hired"].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <label className="block text-sm font-medium mb-1">Signals JSON</label>
      <textarea className="w-full border rounded p-2 mb-3 font-mono text-xs" rows={5} value={signals} onChange={(e) => setSignals(e.target.value)} />
      <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Advance"}
      </button>
      {out && <pre className="bg-gray-50 border rounded p-3 text-xs mt-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}

function ResumeTab() {
  const [text, setText] = useState("");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/ai/resume-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setOut(await resp.json());
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white p-5 rounded border border-gray-200">
      <label className="block text-sm font-medium mb-1">Resume text</label>
      <textarea className="w-full border rounded p-2 mb-3" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste resume text here..." />
      <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Parse"}
      </button>
      {out && <pre className="bg-gray-50 border rounded p-3 text-xs mt-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}

function SalaryTab() {
  const [role, setRole] = useState("software engineer");
  const [level, setLevel] = useState("senior");
  const [city, setCity] = useState("san francisco");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/ai/salary-benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, level, city }),
      });
      setOut(await resp.json());
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white p-5 rounded border border-gray-200">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <input className="w-full border rounded p-2" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select className="w-full border rounded p-2" value={level} onChange={(e) => setLevel(e.target.value)}>
            {["junior", "mid", "senior", "staff", "principal"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input className="w-full border rounded p-2" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
      </div>
      <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Benchmark"}
      </button>
      {out && <pre className="bg-gray-50 border rounded p-3 text-xs mt-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}

function BulkTab() {
  const [recipients, setRecipients] = useState(JSON.stringify([{ email: "demo@example.com", firstName: "Demo", company: "Acme" }], null, 2));
  const [subjectTemplate, setSubject] = useState("Hi {{firstName}} from {{company}}");
  const [bodyTemplate, setBody] = useState("Hi {{firstName}},\n\nWe'd love to chat.\n\nBest");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/campaigns/bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: JSON.parse(recipients), subjectTemplate, bodyTemplate }),
      });
      setOut(await resp.json());
    } catch (e: any) {
      setOut({ error: e?.message });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white p-5 rounded border border-gray-200">
      <label className="block text-sm font-medium mb-1">Recipients JSON</label>
      <textarea className="w-full border rounded p-2 mb-3 font-mono text-xs" rows={4} value={recipients} onChange={(e) => setRecipients(e.target.value)} />
      <label className="block text-sm font-medium mb-1">Subject template</label>
      <input className="w-full border rounded p-2 mb-3" value={subjectTemplate} onChange={(e) => setSubject(e.target.value)} />
      <label className="block text-sm font-medium mb-1">Body template</label>
      <textarea className="w-full border rounded p-2 mb-3" rows={4} value={bodyTemplate} onChange={(e) => setBody(e.target.value)} />
      <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Send Campaign"}
      </button>
      {out && <pre className="bg-gray-50 border rounded p-3 text-xs mt-3 overflow-auto">{JSON.stringify(out, null, 2)}</pre>}
    </div>
  );
}
