import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        contracts: {
          select: { value: true, status: true, endDate: true }
        },
        invoices: {
          select: { status: true, dueDate: true, total: true }
        },
        communications: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true }
        },
        projects: {
          select: { status: true }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // --- Contract Value Score (0-25) ---
    const activeContracts = client.contracts.filter(c => c.status === "ACTIVE");
    const totalContractValue = activeContracts.reduce((sum, c) => sum + c.value, 0);
    // Score: 25 points for $100k+, linear below
    const contractValueScore = Math.min(25, (totalContractValue / 100000) * 25);

    // --- Overdue Invoice Score (0-25) ---
    const now = new Date();
    const overdueInvoices = client.invoices.filter(
      inv => inv.status !== "PAID" && inv.status !== "CANCELLED" && new Date(inv.dueDate) < now
    );
    const totalInvoices = client.invoices.filter(
      inv => inv.status !== "CANCELLED"
    ).length;
    // 25 points if no overdue, deduct proportionally
    const overdueRatio = totalInvoices > 0 ? overdueInvoices.length / totalInvoices : 0;
    const invoiceScore = 25 * (1 - overdueRatio);

    // --- Last Communication Score (0-25) ---
    const lastComm = client.communications[0]?.createdAt;
    let communicationScore = 0;
    if (lastComm) {
      const daysSinceComm = (now.getTime() - new Date(lastComm).getTime()) / (1000 * 60 * 60 * 24);
      // 25 points if within 7 days, 0 if 90+ days, linear in between
      communicationScore = Math.max(0, 25 - (daysSinceComm / 90) * 25);
    }

    // --- Project Completion Rate Score (0-25) ---
    const totalProjects = client.projects.length;
    const completedProjects = client.projects.filter(p => p.status === "COMPLETED").length;
    const cancelledProjects = client.projects.filter(p => p.status === "CANCELLED").length;
    const activeProjectCount = totalProjects - completedProjects - cancelledProjects;
    let projectScore = 0;
    if (totalProjects > 0) {
      // Completed projects boost score, active ones are neutral, cancelled ones penalize
      const completionRate = completedProjects / totalProjects;
      const cancellationPenalty = cancelledProjects / totalProjects;
      projectScore = Math.max(0, 25 * (completionRate - cancellationPenalty * 0.5));
    } else {
      // No projects yet - neutral score
      projectScore = 12.5;
    }

    const totalScore = Math.round(
      contractValueScore + invoiceScore + communicationScore + projectScore
    );

    const clampedScore = Math.max(0, Math.min(100, totalScore));

    let healthStatus: string;
    if (clampedScore >= 80) healthStatus = "EXCELLENT";
    else if (clampedScore >= 60) healthStatus = "GOOD";
    else if (clampedScore >= 40) healthStatus = "FAIR";
    else healthStatus = "AT_RISK";

    return NextResponse.json({
      clientId: id,
      clientName: client.name,
      score: clampedScore,
      status: healthStatus,
      breakdown: {
        contractValue: {
          score: Math.round(contractValueScore),
          maxScore: 25,
          detail: `${activeContracts.length} active contract(s) worth $${totalContractValue.toLocaleString()}`
        },
        invoiceHealth: {
          score: Math.round(invoiceScore),
          maxScore: 25,
          detail: `${overdueInvoices.length} overdue invoice(s) out of ${totalInvoices} total`
        },
        communication: {
          score: Math.round(communicationScore),
          maxScore: 25,
          detail: lastComm
            ? `Last communication ${Math.round((now.getTime() - new Date(lastComm).getTime()) / (1000 * 60 * 60 * 24))} days ago`
            : "No communications on record"
        },
        projectCompletion: {
          score: Math.round(projectScore),
          maxScore: 25,
          detail: `${completedProjects} completed, ${activeProjectCount} active, ${cancelledProjects} cancelled out of ${totalProjects} total`
        }
      },
      computedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error computing client health score:", error);
    return NextResponse.json({ error: "Failed to compute health score" }, { status: 500 });
  }
}
