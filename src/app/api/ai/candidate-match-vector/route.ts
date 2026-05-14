// AI-powered candidate matching via vector embeddings of CVs vs job specs.
// Production-ready version: would use pgvector / OpenAI embeddings. This is
// a v0 scaffold using bag-of-words cosine to keep the endpoint working without
// extra infra. Override by setting EMBEDDINGS_PROVIDER env var.
// TODO: wire real embedding model (OpenAI text-embedding-3-small or similar)
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
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  return counts;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  a.forEach((v) => { na += v * v; });
  b.forEach((v) => { nb += v * v; });
  a.forEach((v, k) => { const w = b.get(k); if (w) dot += v * w; });
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { jobSpec, cvs, topK = 10 } = await request.json();
    if (!jobSpec || !Array.isArray(cvs)) {
      return NextResponse.json(
        { error: "jobSpec (string) and cvs (array of {id, text}) required" },
        { status: 400 }
      );
    }

    const specVec = tokenize(typeof jobSpec === "string" ? jobSpec : JSON.stringify(jobSpec));
    const ranked = cvs.map((cv: any) => {
      const text = typeof cv === "string" ? cv : [cv.text, cv.skills, cv.summary, cv.experience].filter(Boolean).join(" ");
      return {
        id: cv.id ?? null,
        name: cv.name ?? null,
        score: Math.round(cosine(specVec, tokenize(text)) * 1000) / 1000,
      };
    });
    ranked.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      matches: ranked.slice(0, topK),
      algorithm: "cosine_bag_of_words_v0",
      embedding_provider: process.env.EMBEDDINGS_PROVIDER || "local-bow",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
