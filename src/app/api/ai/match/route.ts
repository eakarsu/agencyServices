// In-memory vector candidate matching using bag-of-words cosine similarity.
// PRODUCT-DECISION: Real production system would use a vector DB (pgvector,
// Pinecone) and embeddings from OpenRouter/OpenAI. We use lexical bag-of-words
// here so the feature works without extra infra. Override by setting
// VECTOR_DB_URL (not currently consumed) for a future real backend.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function tokenize(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  const tokens = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s+#.\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (const t of tokens) {
    counts.set(t, (counts.get(t) || 0) + 1);
  }
  return counts;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  a.forEach((v) => {
    na += v * v;
  });
  b.forEach((v) => {
    nb += v * v;
  });
  a.forEach((v, k) => {
    const w = b.get(k);
    if (w) dot += v * w;
  });
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { jobDescription, candidates } = await request.json();
    if (!jobDescription || !Array.isArray(candidates)) {
      return NextResponse.json({ error: "jobDescription (string) and candidates (array) required" }, { status: 400 });
    }

    const jdVec = tokenize(jobDescription);
    const ranked = candidates.map((c: any) => {
      const text = [c.name, c.title, c.skills, c.experience, c.summary].filter(Boolean).join(" ");
      const score = cosine(jdVec, tokenize(text));
      return { id: c.id ?? null, name: c.name ?? "", score: Math.round(score * 1000) / 1000 };
    });
    ranked.sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json({ matches: ranked, algorithm: "cosine_bag_of_words" });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
