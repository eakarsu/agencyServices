import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const toolPrompts: Record<string, string> = {
  content: "You are a professional marketing content writer. Create engaging and persuasive content based on the user's request.",
  email: "You are an expert business email writer. Draft professional, clear, and effective emails based on the user's requirements.",
  social: "You are a social media expert. Create engaging social media posts optimized for engagement and reach.",
  seo: "You are an SEO specialist. Analyze and provide SEO optimization suggestions for the given content.",
  resume: "You are an HR specialist. Analyze and score resumes based on job requirements and candidate qualifications.",
  lead: "You are a sales expert. Score and qualify leads based on their potential value and likelihood to convert.",
  report: "You are a business analyst. Create comprehensive and insightful reports based on the provided data.",
  matcher: "You are a recruiting specialist. Match candidates to job requirements and explain the fit.",
  interview: "You are an HR expert. Generate relevant and insightful interview questions for the given role.",
  proposal: "You are a business development expert. Create professional and persuasive client proposals.",
  campaign: "You are a digital marketing expert. Provide insights and optimization suggestions for marketing campaigns.",
  analysis: "You are a market research analyst. Conduct competitive analysis and provide strategic insights."
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tool, prompt } = await request.json();

    if (!tool || !prompt) {
      return NextResponse.json({ error: "Missing tool or prompt" }, { status: 400 });
    }

    const systemPrompt = toolPrompts[tool] || "You are a helpful assistant.";

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";

    if (!apiKey) {
      return NextResponse.json({
        content: `[Demo Mode] This is a simulated response for the ${tool} tool.\n\nYour request: "${prompt}"\n\nTo enable real AI generation, add your OpenRouter API key to the .env file:\nOPENROUTER_API_KEY=your-api-key-here\nOPENROUTER_MODEL=anthropic/claude-3-haiku`
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Agency Services AI Platform"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "No response generated";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
