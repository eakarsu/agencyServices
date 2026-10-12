"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI salary benchmark advisor advisory report"} apiPath={"/api/gap-ai-salary-benchmark-advisor/run"}/>;
}
