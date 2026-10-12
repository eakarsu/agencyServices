"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI lead-to-deal conversion prediction advisory report"} apiPath={"/api/gap-ai-lead-deal-conversion-prediction/run"}/>;
}
