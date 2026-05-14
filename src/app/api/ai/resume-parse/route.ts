// Resume parsing endpoint.
// PRODUCT-DECISION: We accept plain-text resumes (already extracted via OCR
// upstream or copy-pasted) and use lightweight regex heuristics to extract
// name/email/phone/skills/years-of-experience. Real OCR-from-PDF requires
// extra deps (pdf-parse, tesseract); document via env RESUME_OCR_PROVIDER.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "react",
  "next.js",
  "node.js",
  "django",
  "flask",
  "postgres",
  "mysql",
  "redis",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "graphql",
  "rest",
  "html",
  "css",
  "sql",
];

function parse(text: string) {
  const lower = text.toLowerCase();
  const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || null;
  const phone = (text.match(/\+?\d[\d\s().-]{7,}\d/) || [])[0] || null;
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || "";
  const name = firstLine.length < 60 ? firstLine.trim() : null;
  const skills = COMMON_SKILLS.filter((s) => lower.includes(s));
  const yoeMatch = text.match(/(\d{1,2})\+?\s*(?:years|yrs)/i);
  const yearsOfExperience = yoeMatch ? Number(yoeMatch[1]) : null;
  return { name, email, phone, skills, yearsOfExperience };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text (string) required" }, { status: 400 });
    }
    return NextResponse.json({ parsed: parse(text), method: "regex_heuristics" });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
