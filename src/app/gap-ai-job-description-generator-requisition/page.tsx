"use client";

import FeatureReportWorkspace from "../../components/FeatureReportWorkspace";

export default function AdvisoryReportPage() {
  return <FeatureReportWorkspace title={"AI job description generator from requisition data advisory report"} apiPath={"/api/gap-ai-job-description-generator-requisition/run"}/>;
}
