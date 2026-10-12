"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"e-signature workflow for offer letters and contracts advisory report"} apiPath={"/api/gap-e-signature-workflow-offer-letters/run"}/>;
}
