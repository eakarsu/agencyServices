import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
