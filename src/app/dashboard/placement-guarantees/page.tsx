"use client";

import { useEffect, useState } from "react";

export default function PlacementGuaranteesPage() {
  const [data, setData] = useState<any>({ summary: {}, guarantees: [] });
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    fetch("/api/placement-guarantees").then((res) => res.json()).then(setData);
  }, []);

  const manage = async (id: string) => {
    const res = await fetch("/api/placement-guarantees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPlan(await res.json());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Candidate Placement Guarantee Tracker</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(data.summary).map(([key, value]) => <div className="rounded-lg border bg-white p-4" key={key}><div className="text-2xl font-semibold">{String(value)}</div><div className="text-sm text-gray-500">{key}</div></div>)}
      </div>
      {data.guarantees.map((item: any) => (
        <div className="rounded-lg border bg-white p-4" key={item.id}>
          <h2 className="font-semibold">{item.candidate}</h2>
          <p>{item.client} - {item.daysRemaining} days remaining - {item.status}</p>
          <button className="mt-3 rounded bg-gray-900 px-3 py-2 text-white" onClick={() => manage(item.id)}>Manage guarantee</button>
        </div>
      ))}
      {plan && <pre className="rounded-lg border bg-white p-4">{JSON.stringify(plan, null, 2)}</pre>}
    </div>
  );
}
