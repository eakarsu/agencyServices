// Multi-format resume parser (OCR + NLP). Accepts text, base64 PDF, or
// base64 image; extracts structured candidate fields. v0 uses regex/heuristics
// for text; OCR + LLM-grade NLP requires wiring real providers.
// TODO: wire OCR (Tesseract or cloud OCR) and LLM for entity extraction.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type ParseInput = {
  format: "text" | "pdf_base64" | "image_base64";
  content: string;
  filename?: string;
};

function extractEmail(text: string): string | null {
  const m = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return m ? m[0] : null;
}

function extractPhone(text: string): string | null {
  const m = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  return m ? m[1].trim() : null;
}

function extractName(text: string): string | null {
  const firstLine = (text.split(/\r?\n/)[0] || "").trim();
  if (firstLine && firstLine.length < 80 && /^[A-Za-z][A-Za-z .'-]+$/.test(firstLine)) {
    return firstLine;
  }
  return null;
}

function extractSkills(text: string): string[] {
  // Crude heuristic: search for a "skills" section and take the next 200 chars
  const idx = text.toLowerCase().indexOf("skills");
  if (idx === -1) return [];
  const region = text.slice(idx, idx + 400);
  return Array.from(
    new Set(
      region
        .split(/[,\n•|;/]/)
        .map((s) => s.replace(/[^A-Za-z0-9+#.\- ]/g, "").trim())
        .filter((s) => s.length >= 2 && s.length <= 30 && !/^skills$/i.test(s))
    )
  ).slice(0, 30);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = (await request.json()) as ParseInput;
    const { format, content } = body;
    if (!format || !content) {
      return NextResponse.json({ error: "format and content required" }, { status: 400 });
    }

    let text = "";
    if (format === "text") {
      text = content;
    } else {
      // TODO: replace with real OCR (Tesseract.js, AWS Textract, Google Vision)
      text = "";
      return NextResponse.json({
        warning: "OCR not configured. Submit format=text or wire an OCR provider.",
        parsed: null,
        format,
      });
    }

    const parsed = {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      skills: extractSkills(text),
      raw_length: text.length,
    };

    return NextResponse.json({
      parsed,
      filename: body.filename || null,
      parser: "regex_heuristic_v0",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
