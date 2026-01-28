import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (category) {
      // Get lookups for a specific category
      const lookups = await prisma.lookup.findMany({
        where: { category, active: true },
        orderBy: { order: "asc" },
        select: { value: true, label: true }
      });
      return NextResponse.json(lookups);
    }

    // Get all categories with their lookups
    const lookups = await prisma.lookup.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { order: "asc" }]
    });

    // Group by category
    const grouped = lookups.reduce((acc, lookup) => {
      if (!acc[lookup.category]) {
        acc[lookup.category] = [];
      }
      acc[lookup.category].push({ value: lookup.value, label: lookup.label });
      return acc;
    }, {} as Record<string, { value: string; label: string }[]>);

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Failed to fetch lookups:", error);
    return NextResponse.json({ error: "Failed to fetch lookups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const lookup = await prisma.lookup.create({ data });
    return NextResponse.json(lookup, { status: 201 });
  } catch (error) {
    console.error("Failed to create lookup:", error);
    return NextResponse.json({ error: "Failed to create lookup" }, { status: 500 });
  }
}
