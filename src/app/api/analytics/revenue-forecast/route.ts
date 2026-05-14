import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";

interface MonthlyRevenue {
  year: number;
  month: number;
  label: string;
  revenue: number;
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Pull last 6 months of paid invoices
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: sixMonthsAgo, lte: now }
      },
      select: { total: true, paidAt: true }
    });

    // Group by month
    const monthlyMap: Record<string, number> = {};
    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const d = new Date(inv.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = (monthlyMap[key] ?? 0) + inv.total;
    }

    // Build ordered array for last 6 months
    const historicalData: MonthlyRevenue[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;
      historicalData.push({
        year,
        month,
        label: d.toLocaleString("default", { month: "short", year: "numeric" }),
        revenue: monthlyMap[key] ?? 0
      });
    }

    const revenues = historicalData.map(m => m.revenue);
    const totalHistorical = revenues.reduce((a, b) => a + b, 0);
    const avgMonthly = revenues.length > 0 ? totalHistorical / revenues.length : 0;

    // Calculate linear trend (least squares)
    const n = revenues.length;
    const xMean = (n - 1) / 2;
    const yMean = avgMonthly;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (revenues[i]! - yMean);
      denominator += (i - xMean) ** 2;
    }
    const slope = denominator !== 0 ? numerator / denominator : 0;

    // Compute standard deviation for confidence intervals
    const diffs = revenues.map(r => (r - avgMonthly) ** 2);
    const variance = diffs.reduce((a, b) => a + b, 0) / Math.max(n - 1, 1);
    const stdDev = Math.sqrt(variance);

    // Project next 3 months
    const forecast: Array<{
      label: string;
      projected: number;
      low: number;
      high: number;
      confidence: number;
    }> = [];

    for (let i = 1; i <= 3; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() + i);
      const projected = Math.max(0, avgMonthly + slope * (n - 1 + i));
      const marginFactor = 1 + i * 0.1; // wider interval further out
      const margin = stdDev * 1.645 * marginFactor; // 90% CI
      const confidence = Math.max(50, 90 - (i - 1) * 10); // decreases with distance

      forecast.push({
        label: d.toLocaleString("default", { month: "short", year: "numeric" }),
        projected: Math.round(projected),
        low: Math.round(Math.max(0, projected - margin)),
        high: Math.round(projected + margin),
        confidence
      });
    }

    const quarterProjected = forecast.reduce((s, m) => s + m.projected, 0);

    // Optionally enrich with AI narrative if OpenRouter key is set
    let aiNarrative: string | null = null;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (apiKey) {
      try {
        const histSummary = historicalData
          .map(m => `${m.label}: $${m.revenue.toLocaleString()}`)
          .join(", ");
        const forecastSummary = forecast
          .map(m => `${m.label}: $${m.projected.toLocaleString()} (${m.low}–${m.high})`)
          .join(", ");

        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
            "X-Title": "Agency Services AI Platform"
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "anthropic/claude-3-haiku",
            messages: [
              {
                role: "system",
                content: "You are a financial analyst. Provide a concise 2-3 sentence narrative about the revenue trend and forecast. Be specific about numbers."
              },
              {
                role: "user",
                content: `Historical monthly revenue (last 6 months): ${histSummary}. Projected next quarter: ${forecastSummary}. Monthly trend slope: $${Math.round(slope)}/month. Analyze this data and provide a brief executive summary.`
              }
            ],
            max_tokens: 200,
            temperature: 0.3
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiNarrative = aiData.choices?.[0]?.message?.content ?? null;
        }
      } catch (aiError) {
        console.error("AI narrative generation failed (non-fatal):", aiError);
      }
    }

    return NextResponse.json({
      historical: historicalData,
      forecast,
      summary: {
        avgMonthlyRevenue: Math.round(avgMonthly),
        monthlyTrendSlope: Math.round(slope),
        quarterProjected,
        quarterLow: forecast.reduce((s, m) => s + m.low, 0),
        quarterHigh: forecast.reduce((s, m) => s + m.high, 0),
        dataPoints: paidInvoices.length
      },
      aiNarrative,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating revenue forecast:", error);
    return NextResponse.json({ error: "Failed to generate revenue forecast" }, { status: 500 });
  }
}
