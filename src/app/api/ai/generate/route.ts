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

// Structured output tools that return JSON
const structuredTools = new Set(["resume", "lead", "seo", "campaign", "analysis"]);

// SSE streaming endpoint - GET /api/ai/generate/stream?tool=X&prompt=Y
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const tool = searchParams.get("tool");
  const prompt = searchParams.get("prompt");

  if (!tool || !prompt) {
    return NextResponse.json({ error: "Missing tool or prompt" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";
  const systemPrompt = toolPrompts[tool] || "You are a helpful assistant.";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      if (!apiKey) {
        sendEvent("chunk", { text: `[Demo Mode] Streaming response for ${tool} tool.\n\nRequest: "${prompt}"` });
        sendEvent("done", { content: `[Demo Mode] Streaming response for ${tool} tool.` });
        controller.close();
        return;
      }

      try {
        sendEvent("status", { message: "Connecting to AI..." });

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
            "X-Title": "Agency Services AI Platform"
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7,
            stream: true
          })
        });

        if (!response.ok || !response.body) {
          sendEvent("error", { message: "Failed to connect to AI service" });
          controller.close();
          return;
        }

        sendEvent("status", { message: "Generating..." });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                fullContent += text;
                sendEvent("chunk", { text });
              }
            } catch {
              // skip malformed SSE lines
            }
          }
        }

        sendEvent("done", { content: fullContent });
        controller.close();
      } catch (error) {
        console.error("SSE AI stream error:", error);
        sendEvent("error", { message: "Stream failed" });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}

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
    const isStructured = structuredTools.has(tool);

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku";

    if (!apiKey) {
      return NextResponse.json({
        content: `[Demo Mode] This is a simulated response for the ${tool} tool.\n\nYour request: "${prompt}"\n\nTo enable real AI generation, add your OpenRouter API key to the .env file:\nOPENROUTER_API_KEY=your-api-key-here\nOPENROUTER_MODEL=anthropic/claude-3-haiku`,
        structured: isStructured ? { demo: true, tool, prompt } : null
      });
    }

    const userMessage = isStructured
      ? `${prompt}\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code fences, no explanatory text outside the JSON object.`
      : prompt;

    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 2000,
      temperature: 0.7
    };

    // Request JSON response format for structured tools
    if (isStructured) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Agency Services AI Platform"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "No response generated";

    if (isStructured) {
      try {
        let cleaned = rawContent.trim().replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ content: rawContent, structured: parsed });
      } catch {
        // If JSON parse fails, return raw with a parse warning
        return NextResponse.json({ content: rawContent, structured: null, parseWarning: true });
      }
    }

    return NextResponse.json({ content: rawContent });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}
