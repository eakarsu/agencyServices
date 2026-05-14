import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, name: true, budget: true, spent: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const [aggregates, metricsOverTime] = await Promise.all([
      prisma.campaignMetric.aggregate({
        where: { campaignId: id },
        _sum: {
          impressions: true,
          clicks: true,
          conversions: true,
          spend: true,
          revenue: true
        },
        _count: { id: true }
      }),
      prisma.campaignMetric.findMany({
        where: { campaignId: id },
        orderBy: { date: "asc" },
        select: {
          date: true,
          impressions: true,
          clicks: true,
          conversions: true,
          spend: true,
          revenue: true
        }
      })
    ]);

    const totalImpressions = aggregates._sum.impressions ?? 0;
    const totalClicks = aggregates._sum.clicks ?? 0;
    const totalConversions = aggregates._sum.conversions ?? 0;
    const totalSpend = aggregates._sum.spend ?? 0;
    const totalRevenue = aggregates._sum.revenue ?? 0;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const costPerClick = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const revenuePerConversion = totalConversions > 0 ? totalRevenue / totalConversions : 0;
    const budgetUtilization = (campaign.budget ?? 0) > 0
      ? ((campaign.spent ?? 0) / (campaign.budget as number)) * 100
      : 0;

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        budget: campaign.budget,
        spent: campaign.spent
      },
      summary: {
        totalImpressions,
        totalClicks,
        totalConversions,
        totalSpend,
        totalRevenue,
        ctr: parseFloat(ctr.toFixed(2)),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        costPerClick: parseFloat(costPerClick.toFixed(2)),
        costPerConversion: parseFloat(costPerConversion.toFixed(2)),
        revenuePerConversion: parseFloat(revenuePerConversion.toFixed(2)),
        budgetUtilization: parseFloat(budgetUtilization.toFixed(2)),
        dataPoints: aggregates._count.id
      },
      metricsOverTime
    });
  } catch (error) {
    console.error("Error fetching campaign metrics:", error);
    return NextResponse.json({ error: "Failed to fetch campaign metrics" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await request.json();

    const metric = await prisma.campaignMetric.create({
      data: {
        campaignId: id,
        date: new Date(data.date),
        impressions: parseInt(data.impressions) || 0,
        clicks: parseInt(data.clicks) || 0,
        conversions: parseInt(data.conversions) || 0,
        spend: parseFloat(data.spend) || 0,
        revenue: parseFloat(data.revenue) || 0
      }
    });

    // Update campaign spent
    await prisma.campaign.update({
      where: { id },
      data: { spent: { increment: parseFloat(data.spend) || 0 } }
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error("Error creating metric:", error);
    return NextResponse.json({ error: "Failed to create metric" }, { status: 500 });
  }
}
