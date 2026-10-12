"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI commission anomaly / clawback detection advisory report"} apiPath={"/api/gap-ai-commission-anomaly-clawback-detection/run"}/>;
}
